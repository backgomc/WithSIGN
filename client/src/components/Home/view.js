import React, { useState } from 'react';
import { Route } from 'react-router-dom';
import { Router } from '@reach/router';
import { view as Header } from '../Header';
import { view as Sidebar } from '../Sidebar';
import Test from '../Test/Test';
import Welcome from '../Welcome';
import Assign from '../Assign/Assign';
import Preparation from '../PrepareDocument/PrepareDocument';
// import { view as Topo } from '../topo';
// import { view as Pkg } from '../pkg';
// import { view as User } from '../user';
import styles from './home.module.css';

const HomePage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 80 : 256;
  const sidebarStyle = {
    gridTemplateColumns: sidebarWidth + 'px 1fr'
  };

  return (
    <div style={sidebarStyle} className={styles.container}>
      <div className={styles.header}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div className={styles.sidebar}>
        <Sidebar collapsed={collapsed} />
      </div>
      <div className={styles.content}>
        {/* <Route path="/home/assign" component={Assign} /> */}
        {/* <Route path="/home/landing" component={Welcome} /> */}
        {/* <Route path="/home/prepareDocument" component={Preparation} /> */}
        {/* <Route path="/home/users" component={User} />
        <Route path="/home/pkgs" component={Pkg} /> */}

        <Router>
          <Welcome path="/" />
          <Assign path="/home/assign" />
          <Preparation path="/home/prepareDocument" />
          {/* <Sign path="/home/signDocument" />
          <View path="/home/viewDocument" /> */}
        </Router>

      </div>
    </div>
  );
};

export default HomePage;