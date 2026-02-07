import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api/client";

export default function Members() {
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [filterPayment, setFilterPayment] = useState("all");

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        age: "",
        gender: "Male",
        cardUid: "",
        membershipPlanId: "",
        paymentMethod: "Cash",
        dailyAccessLimit: 1,
        subscriptionExpiresAt: ""
    });

    const [readingCard, setReadingCard] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [m, p] = await Promise.all([
                    apiFetch("/Members"),
                    apiFetch("/MembershipPlans")
                ]);
                setMembers(m);
                setPlans(p);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleReadCard = async () => {
        setReadingCard(true);
        try {
            const res = await apiFetch("/Cards/read", { method: "POST" });
            setForm({ ...form, cardUid: res.cardUid });
        } catch (e) {
            alert("Card read failed or timed out: " + e.message);
        } finally {
            setReadingCard(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiFetch("/Members", {
                method: "POST",
                body: {
                    ...form,
                    age: parseInt(form.age || "0"),
                    subscriptionExpiresAt: form.subscriptionExpiresAt ? new Date(form.subscriptionExpiresAt).toISOString() : null
                }
            });
            setShowAdd(false);
            // Reload members
            const m = await apiFetch("/Members");
            setMembers(m);
        } catch (e) {
            alert("Failed to save member: " + e.message);
        }
    };

    const filteredMembers = useMemo(() => {
        if (filterPayment === "all") return members;
        return members.filter(m => m.paymentMethod === filterPayment);
    }, [members, filterPayment]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="ag-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 className="ag-sectionTitle">Members</h2>
                <button className="ag-btn ag-btnPrimary" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? "Cancel" : "Add New Member"}
                </button>
            </div>

            {showAdd && (
                <div className="ag-card" style={{ marginBottom: 20 }}>
                    <h3>Enroll New Member</h3>
                    <form onSubmit={handleSubmit} className="ag-grid">
                        <div className="ag-col-4">
                            <label>Full Name</label>
                            <input className="ag-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                        </div>
                        <div className="ag-col-4">
                            <label>Phone</label>
                            <input className="ag-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                        </div>
                        <div className="ag-col-4">
                            <label>Gender</label>
                            <select className="ag-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="ag-col-4">
                            <label>Card Number</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input className="ag-input" value={form.cardUid} readOnly placeholder="Tap card to read..." />
                                <button type="button" className="ag-btn ag-btnSecondary" onClick={handleReadCard} disabled={readingCard}>
                                    {readingCard ? "Reading..." : "Read"}
                                </button>
                            </div>
                        </div>
                        <div className="ag-col-4">
                            <label>Membership Plan</label>
                            <select className="ag-input" value={form.membershipPlanId} onChange={e => setForm({ ...form, membershipPlanId: e.target.value })}>
                                <option value="">Select Plan</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₪{p.cost})</option>)}
                            </select>
                        </div>
                        <div className="ag-col-4">
                            <label>Payment Method</label>
                            <select className="ag-input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                                <option>Cash</option>
                                <option>Card</option>
                            </select>
                        </div>
                        <div className="ag-col-12">
                            <button className="ag-btn ag-btnPrimary">Save Member</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="ag-card">
                <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
                    <span>Filter by Payment:</span>
                    <button className={`ag-btn ${filterPayment === 'all' ? 'ag-btnPrimary' : 'ag-btnSecondary'}`} onClick={() => setFilterPayment('all')}>All</button>
                    <button className={`ag-btn ${filterPayment === 'Cash' ? 'ag-btnPrimary' : 'ag-btnSecondary'}`} onClick={() => setFilterPayment('Cash')}>Cash</button>
                    <button className={`ag-btn ${filterPayment === 'Card' ? 'ag-btnPrimary' : 'ag-btnSecondary'}`} onClick={() => setFilterPayment('Card')}>Visa/Card</button>
                </div>
                <table className="ag-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Plan</th>
                            <th>Expiry</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map(m => (
                            <tr key={m.id}>
                                <td>{m.fullName}</td>
                                <td>{m.phone}</td>
                                <td>{m.membershipPlan?.name || "N/A"}</td>
                                <td>{m.subscriptionExpiresAt ? new Date(m.subscriptionExpiresAt).toLocaleDateString() : "-"}</td>
                                <td>
                                    <span className={`ag-pill ${new Date(m.subscriptionExpiresAt) > new Date() ? 'ag-pillSuccess' : 'ag-pillDanger'}`}>
                                        {new Date(m.subscriptionExpiresAt) > new Date() ? 'Active' : 'Expired'}
                                    </span>
                                </td>
                                <td>
                                    <button className="ag-btn ag-btnSecondary">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
