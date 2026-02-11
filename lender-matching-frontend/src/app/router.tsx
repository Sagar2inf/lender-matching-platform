import { createBrowserRouter } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import LenderRegisterPage from "./pages/Lender/Register"
import LenderLoginPage from "./pages/Lender/Login"
import LenderDashboardPage from "./pages/Lender/Dashboard"
import BorrowerForm from "./pages/Borrower/BorrowerPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/lender/register",
    element: <LenderRegisterPage />,
  },
  {
    path: "/lender/login",
    element: <LenderLoginPage />,
  },
  {
    path: "/lender/dashboard",
    element: <LenderDashboardPage />,
  },
  {
    path: "/borrower/form",
    element: <BorrowerForm />,
  },
])