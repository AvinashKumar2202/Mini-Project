import React, { Suspense } from "react";

const Loadable = (Component) => (props) =>
(
  <Suspense fallback={<div style={{ padding: '20px', color: 'white', background: '#0a0a14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading component...</div>}>
    <Component {...props} />
  </Suspense>
);

export default Loadable;
