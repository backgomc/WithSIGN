import React from 'react';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import {
  Box,
  Button,
  Text,
  Avatar,
  Row,
  Stack,
  Column,
  Heading,
} from 'gestalt';
import 'gestalt/dist/gestalt.css';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setUser } from '../../app/infoSlice';
import { resetSignee } from '../Assign/AssignSlice';
import { navigate, Link } from '@reach/router';
import './Profile.css';


const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { name, photoURL, email } = user;

  return (
    <Box display="flex" direction="row" paddingY={2} color={'lightGray'}>
      <Column span={9}>
        <Box padding={3}>
          <Link to="/" className='profileLink'><Heading size="lg">With Sign</Heading></Link>
        </Box>
      </Column>
      <Column span={3}>
        <Box padding={1}>
          <Row>
            <Box padding={1}>
              {/* <Avatar name={name} size="md" src={photoURL} /> */}
            </Box>
            <Stack>
              <Text weight="bold">{name}</Text>
              <Text>{email}</Text>
            </Stack>
            <Box padding={1}>
              <Button
                onClick={() => {
                  // auth.signOut();

                  axios.post(`/api/users/logout`).then(response => {
                    if (response.status === 200) {
                      localStorage.removeItem('__rToken__');
                      dispatch(setUser(null));
                      dispatch(resetSignee())
                      navigate('/login');
                    } else {
                      alert('Log Out Failed')
                    }
                  });

                }}
                accessibilityLabel="Sign out of your account"
                text="Sign out"
              />
            </Box>
          </Row>
        </Box>
      </Column>
    </Box>
  );
};
export default ProfilePage;
