import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import { ProductsProvider } from "./context/ProductsContext";
import { CartProvider } from "./context/CartContext";
import StoreLayout from "./components/layout/StoreLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import RequireUser from "./components/RequireUser";
import Home from "./pages/Home";
import Success from "./pages/Success";
import Chat from "./pages/Chat";
import MyChats from "./pages/MyChats";
import Login from "./pages/Login";
import Account from "./pages/Account";
import AccountOrders from "./pages/AccountOrders";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Chats from "./pages/admin/Chats";
import Customize from "./pages/admin/Customize";
import Settings from "./pages/admin/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <Routes>
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/chat/:token" element={<Chat />} />
                  <Route path="/my-chats" element={<MyChats />} />
                  <Route path="/login" element={<Login />} />
                  <Route element={<RequireUser />}>
                    <Route path="/account" element={<Account />} />
                    <Route path="/account/orders" element={<AccountOrders />} />
                  </Route>
                </Route>

                {/* The old admin login address now goes to the shared login page */}
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="products" element={<Products />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="chats/:orderId?" element={<Chats />} />
                    <Route path="customize" element={<Customize />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>
              </Routes>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}