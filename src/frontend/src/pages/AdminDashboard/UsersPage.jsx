// pages/UsersPage.js
import { useEffect, useState } from "react";
import { FaSearch, FaEnvelope,  FaUsers, FaTrashAlt } from "react-icons/fa";
import {   getAllUsers, 
  updateUser, 
  deleteUser  } from "../../api/user";
import "../../css/Userspage.css";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);


  const stats = {
    total: users.length,
    instructors: users.filter((u) => u.role === "INSTRUCTOR").length,
    students: users.filter((u) => u.role === "STUDENT").length,
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // rows per page

  // compute filtered users (search + role) then paginate
  const filteredUsers = users.filter((user) => {
    const roleMatch = selectedRole === "all" || user.role === selectedRole;
    const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // keep currentPage in bounds when filteredUsers changes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  const handlePrev = () => goToPage(currentPage - 1);
  const handleNext = () => goToPage(currentPage + 1);

  const handleRoleChange = async (userId, newRole) => {
    const prevUsers = users;
    // optimistic update
    setUsers((u) => u.map((usr) => (usr.id === userId ? { ...usr, role: newRole } : usr)));
    try {
      await updateUser(userId, { role: newRole });
    } catch (err) {
      // revert on failure
      setUsers(prevUsers);
      setError("Failed to update user role.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(userId);
      setUsers((u) => u.filter((usr) => usr.id !== userId));
      // if deleting last item on page, move back a page
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  return (
    <div>
      <div className="page-header"
      dir="rtl">
        <h1 className="page-header-h1"><FaUsers /> مدير المستخدمين</h1>
      </div>

      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}
      {loading ? (
        <div className="card">Loading users...</div>
      ) : (
        <>
          <div className="stats-grid mini">
            <div className="stat-card mini">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">عدد المستخدمين</span>
            </div>
           
            <div className="stat-card mini">
              <span className="stat-value">{stats.instructors}</span>
              <span className="stat-label">مدرب</span>
            </div>
            <div className="stat-card mini">
              <span className="stat-value">{stats.students}</span>
              <span className="stat-label">الطلاب</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>جميع المستخدمين</h3>
              <div className="card-controls">
                <div className="search-bar">
                  <FaSearch/>
                  <input
                  className="search-bar-input"
                    type="text"
                    placeholder="ابحث عن المستخدمين..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select className="filter-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="all">جميع الأدوار</option>
                  <option value="ADMIN">المسؤل</option>
                  <option value="INSTRUCTOR">المدرب</option>
                  <option value="STUDENT">الطلاب</option>
                </select>
               
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>البريد الالكتروني</th>
                    <th>دوره</th>
                    <th>اجراءات</th>
                  </tr>
                </thead>
                <tbody>
                 {paginatedUsers.map((user) => {
                    
                    return (
                      <tr key={user.id}>
                        <td>
                          <span className="user-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
                          <strong>{user.name}</strong>
                        </td>
                        <td><FaEnvelope className="email-icon" /> {user.email}</td>
                        <td>
                          <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}>
                            <option value="ADMIN">المسؤل</option>
                            <option value="INSTRUCTOR">المدرب</option>
                            <option value="STUDENT">الطلاب</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user.id)}><FaTrashAlt /> حذف</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing {filteredUsers.length === 0 ? 0 : (Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length))} - {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <div className="pagination">
                <button className="btn btn-sm btn-outline" onClick={handlePrev} disabled={currentPage === 1}>Previous</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${currentPage === i + 1 ? "btn-primary" : "btn-outline"}`}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="btn btn-sm btn-outline" onClick={handleNext} disabled={currentPage === totalPages}>Next</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
