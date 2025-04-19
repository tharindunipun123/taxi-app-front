import React from 'react';
import { HashRouter  as Router, Routes, Route } from 'react-router-dom';
import Footer from './Components/Footer/Footer';
import DashboardLayout from './DashboardLayout';
import CustomerDash from './Components/CustomerDash/CustomerDash';
import CustomerView from './Components/CustomerView/CustomerView';
import Hires from './Components/Hires/Hires';
import DriverApp from './Components/DriverApp/DriverApp';
import Location from './Components/Location/Location';
import Vehicles from './Components/Vehicles/Vehicles';
import Payments from './Components/Payments/Payments';
import Animal from './Components/Animal/Animal';
import Dashboard from './Components/CustomerDash/CustomerDash';
import RequestHandler from './Components/CustomerDash/CustomerDash';

const App = () => {
  return (
    <Router>
      {/* <Animal /> */}
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<RequestHandler />} />
          <Route path="/customers" element={<CustomerView />} />
          <Route path="/drivers" element={<DriverApp />} />
          <Route path="/locations" element={<Location />} />
          <Route path="/hires" element={<Hires />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/payments" element={<Payments />} />
        </Routes>
      </DashboardLayout>
      {/* <Footer /> */}
    </Router>
  );
}

export default App;