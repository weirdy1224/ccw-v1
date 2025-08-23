const PendingCases = ({ requests }) => {
  const pendingAssigned = requests.filter(
    req => req.status === 'Pending' && req.assigned_to // <-- use _not_ camelCase if not mapped!
  ).length;

  return (
    <div className="metric-card">
      <h4>Pending Assigned CCPS Cases</h4>
      <p>{pendingAssigned}</p>
    </div>
  );
};

export default PendingCases;
