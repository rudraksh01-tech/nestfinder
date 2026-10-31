import { Route, Routes } from 'react-router-dom'
import CompareBar from './components/CompareBar.jsx'
import Navbar from './components/Navbar.jsx'
import RequireBroker from './components/RequireBroker.jsx'
import { useShortlist } from './context/ShortlistContext.jsx'
import Home from './pages/Home.jsx'
import Listings from './pages/Listings.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Match from './pages/Match.jsx'
import RentCheck from './pages/RentCheck.jsx'
import Compare from './pages/Compare.jsx'
import BrokerLogin from './pages/BrokerLogin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ListingForm from './pages/ListingForm.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  const { codes } = useShortlist()
  return (
    // Extra bottom space while the floating compare bar is showing, so it never covers content.
    <div className={codes.length ? 'pb-28' : ''}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flats" element={<Listings />} />
        <Route path="/flats/:code" element={<ListingDetail />} />
        <Route path="/match" element={<Match />} />
        <Route path="/rent-check" element={<RentCheck />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/broker/login" element={<BrokerLogin />} />
        <Route path="/broker" element={<RequireBroker><Dashboard /></RequireBroker>} />
        <Route path="/broker/listings/new" element={<RequireBroker><ListingForm /></RequireBroker>} />
        <Route path="/broker/listings/:code/edit" element={<RequireBroker><ListingForm /></RequireBroker>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CompareBar />
    </div>
  )
}
