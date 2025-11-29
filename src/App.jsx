import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from '@/Layout'
import Home from '@/Pages/Home'
import Counter from '@/Pages/Counter'
import DhikrLibrary from '@/Pages/DhikerLibrary'
import Goals from '@/Pages/Goals'
import Calendar from '@/Pages/Calendar'
import HijriCalendar from '@/Pages/HijriCalendar'
import Settings from '@/Pages/Settings'

function App() {
  return (
    <>
      <Toaster position="top-center" richColors dir="rtl" />
      <Routes>
        <Route path="/" element={<Layout currentPageName="Home"><Home /></Layout>} />
        <Route path="/counter" element={<Layout currentPageName="Counter"><Counter /></Layout>} />
        <Route path="/dhikr-library" element={<Layout currentPageName="DhikrLibrary"><DhikrLibrary /></Layout>} />
        <Route path="/goals" element={<Layout currentPageName="Goals"><Goals /></Layout>} />
        <Route path="/calendar" element={<Layout currentPageName="Calendar"><Calendar /></Layout>} />
        <Route path="/hijri-calendar" element={<Layout currentPageName="HijriCalendar"><HijriCalendar /></Layout>} />
        <Route path="/settings" element={<Layout currentPageName="Settings"><Settings /></Layout>} />
      </Routes>
    </>
  )
}

export default App
