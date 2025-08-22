import React from 'react'
import { Navigate ,Outlet } from 'react-router'

const Protected = () => {
    const isAuthenticated = localStorage.getItem("token");
 return isAuthenticated ? <Outlet/> : <Navigate to="/admin/login" replace/>
}

export default Protected
