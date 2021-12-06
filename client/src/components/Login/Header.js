
import React from 'react';
import styles from './login.module.css';
import logo from '../../assets/images/logo_withsign1.png';
import { useIntl } from "react-intl";

const Header = () => {
    const { formatMessage } = useIntl();

    return (
        <div className={styles.header}>
        <div className={styles['header-wrapper']}>
          <header>
            <a href="/">
              <img src={logo} alt="With Sign" />
              <h2>{formatMessage({id: 'AppName'})}</h2>
            </a>
            <div className={styles['nav-wrapper']}>
              <nav>
                <ul>
                  <li>
                    {/* <Link to="/register">{formatMessage({id: 'Register'})}</Link> */}
                  </li>
                </ul>
              </nav>
            </div>
          </header>
        </div>
      </div>
    )
}

export default Header;