import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import RequireBroker from './components/RequireBroker.jsx'
import Home from './pages/Home.jsx'
import Listings from './pages/Listings.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import BrokerLogin from './pages/BrokerLogin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ListingForm from './pages/ListingForm.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flats" element={<Listings />} />
        <Route path="/flats/:code" element={<ListingDetail />} />
        <Route path="/broker/login" element={<BrokerLogin />} />
        <Route path="/broker" element={<RequireBroker><Dashboard /></RequireBroker>} />
        <Route path="/broker/listings/new" element={<RequireBroker><ListingForm /></RequireBroker>} />
        <Route path="/broker/listings/:code/edit" element={<RequireBroker><ListingForm /></RequireBroker>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
