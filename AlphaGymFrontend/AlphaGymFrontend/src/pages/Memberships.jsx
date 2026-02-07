import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";

export default function Memberships() {
    const [plans, setPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({ name: "", cost: 0, durationDays: 30 });
    const [busy, setBusy] = useState(false);

    const fetchPlans = async () => {
        const data = await apiFetch("/MembershipPlans");
        setPlans(data);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await apiFetch("/MembershipPlans", {
                method: "POST",
                body: newPlan,
            });
            setNewPlan({ name: "", cost: 0, durationDays: 30 });
            fetchPlans();
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this plan?")) return;
        await apiFetch(`/MembershipPlans/${id}`, { method: "DELETE" });
        fetchPlans();
    };

    return (
        <div className="ag-container">
            <h2 className="ag-sectionTitle">Membership Plans</h2>

            <div className="ag-grid">
                <div className="ag-col-4">
                    <div className="ag-card">
                        <h3 style={{ marginTop: 0 }}>Create Plan</h3>
                        <form onSubmit={handleCreate}>
                            <div className="ag-inputGroup">
                                <label>Plan Name</label>
                                <input
                                    className="ag-input"
                                    value={newPlan.name}
                                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                    placeholder="e.g. Yearly"
                                    required
                                />
                            </div>
                            <div className="ag-inputGroup">
                                <label>Cost (₪)</label>
                                <input
                                    className="ag-input"
                                    type="number"
                                    value={newPlan.cost}
                                    onChange={(e) => setNewPlan({ ...newPlan, cost: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="ag-inputGroup">
                                <label>Duration (Days)</label>
                                <input
                                    className="ag-input"
                                    type="number"
                                    value={newPlan.durationDays}
                                    onChange={(e) => setNewPlan({ ...newPlan, durationDays: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <button className="ag-btn ag-btnPrimary" style={{ width: "100%" }} disabled={busy}>
                                Create Plan
                            </button>
                        </form>
                    </div>
                </div>

                <div className="ag-col-8">
                    <div className="ag-card">
                        <table className="ag-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Cost</th>
                                    <th>Duration</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>₪{p.cost}</td>
                                        <td>{p.durationDays} days</td>
                                        <td>
                                            <button className="ag-btn ag-btnDanger" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
