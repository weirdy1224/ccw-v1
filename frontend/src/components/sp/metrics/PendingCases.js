import React from 'react';

const PendingCases = ({ requests }) => {
  const pending = requests.filter(req => req.status === 'Pending').length;
  return (
    <div className="metric-card">
      <h4>Pending Police Cases</h4>
      <p>{pending}</p>
    </div>
  );
};

export default PendingCases;