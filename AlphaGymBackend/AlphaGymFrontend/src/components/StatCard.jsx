import "../styles/widgets.css";

export default function StatCard({ title, value, hint, accent = "cyan" }) {
  return (
    <div className={`ag-card ag-stat ag-accent-${accent}`}>
      <div className="ag-statTitle">{title}</div>
      <div className="ag-statValue">{value}</div>
      {hint ? <div className="ag-statHint">{hint}</div> : null}
    </div>
  );
}
