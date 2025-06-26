import React from 'react';

const TotalRequests = ({ requests }) => (
  <div className="metric-card">
    <h4>Total Requests</h4>
    <p>{requests.length}</p>
  </div>
);

export default TotalRequests;