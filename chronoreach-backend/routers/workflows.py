from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models import Workflow, WorkflowNode, WorkflowEdge

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

@router.post("")
async def create_workflow(payload: dict, db: AsyncSession = Depends(get_db)):
    name = payload.get("name")
    nodes_data = payload.get("nodes", [])
    edges_data = payload.get("edges", [])
    
    wf = Workflow(name=name, description=payload.get("description", ""))
    db.add(wf)
    await db.flush()
    
    node_ids = set()
    for nd in nodes_data:
        n = WorkflowNode(
            id=nd["id"], workflow_id=wf.id, node_type=nd["node_type"],
            label=nd.get("label"), config=nd.get("config"),
            position_x=nd.get("position_x"), position_y=nd.get("position_y")
        )
        db.add(n)
        node_ids.add(nd["id"])
        
    for ed in edges_data:
        if ed["source"] not in node_ids or ed["target"] not in node_ids:
            raise HTTPException(400, "Edge reference invalid node ID")
        e = WorkflowEdge(
            id=ed.get("id", f"{ed['source']}_{ed['target']}"),
            workflow_id=wf.id, source=ed["source"], target=ed["target"],
            condition_label=ed.get("condition_label")
        )
        db.add(e)
        
    await db.commit()
    return {"id": wf.id}

@router.get("/{wf_id}")
async def get_workflow(wf_id: int, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, wf_id)
    if not wf: raise HTTPException(404, "Workflow not found")
    
    nodeses = await db.execute(select(WorkflowNode).where(WorkflowNode.workflow_id == wf_id))
    edgeses = await db.execute(select(WorkflowEdge).where(WorkflowEdge.workflow_id == wf_id))
    
    return {
        "id": wf.id, "name": wf.name,
        "nodes": [{"id": n.id, "node_type": n.node_type, "label": n.label, "config": n.config} for n in nodeses.scalars().all()],
        "edges": [{"source": e.source, "target": e.target, "condition_label": e.condition_label} for e in edgeses.scalars().all()]
    }

@router.put("/{wf_id}")
async def update_workflow(wf_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, wf_id)
    if not wf: raise HTTPException(404)
    
    wf.name = payload.get("name", wf.name)
    
    await db.execute(delete(WorkflowEdge).where(WorkflowEdge.workflow_id == wf_id))
    await db.execute(delete(WorkflowNode).where(WorkflowNode.workflow_id == wf_id))
    
    nodes_data = payload.get("nodes", [])
    edges_data = payload.get("edges", [])
    
    for nd in nodes_data:
        db.add(WorkflowNode(id=nd["id"], workflow_id=wf_id, node_type=nd["node_type"], config=nd.get("config")))
        
    for ed in edges_data:
        db.add(WorkflowEdge(id=ed.get("id", f"edge_{id(ed)}"), workflow_id=wf_id, source=ed["source"], target=ed["target"], condition_label=ed.get("condition_label")))
        
    await db.commit()
    return {"status": "success"}
