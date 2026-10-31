import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Listings from './pages/Listings.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flats" element={<Listings />} />
        <Route path="/flats/:code" element={<ListingDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
