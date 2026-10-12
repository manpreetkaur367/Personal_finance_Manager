import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ title, children }) => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-panel">
      <Navbar title={title} />
      <div className="page-content">{children}</div>
    </main>
  </div>
);

export default MainLayout;
