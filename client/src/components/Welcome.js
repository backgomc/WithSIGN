import React, { useEffect } from 'react';
import Profile from './Profile/Profile';
import { navigate } from '@reach/router';
import { useDispatch } from 'react-redux';
import SignList from './Lists/SignList';
import DocumentList from './Lists/DocumentList';
import SignedList from './Lists/SignedList';
import { resetDocToView } from './ViewDocument/ViewDocumentSlice';
import { resetDocToSign } from './SignDocument/SignDocumentSlice';
import { Box, Button, Container, Heading } from 'gestalt';
// import 'gestalt/dist/gestalt.css';
import { Typography } from 'antd';
const { Title } = Typography;

const Welcome = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(resetDocToView());
    dispatch(resetDocToSign());
  }, [dispatch]);

  return (
    <div>
      {/* <Title level={3}>서명 할 문서</Title> */}
      <DocumentList />
      {/* <Profile />
      <Container>
        <Box padding={3}>
          <Heading size="md">{`서명할 문서`}</Heading>
        </Box>
        <Box padding={3}>
          <SignList />
        </Box>
        <Box padding={3}>
          <Heading size="md">{`Prepare Document`}</Heading>
        </Box>
        <Box padding={2}>
          <Button
            onClick={event => {
              navigate(`/assign`);
            }}
            text="Prepare Document for Signing"
            color="blue"
            inline
          />
        </Box>
        <Box padding={3}>
          <Heading size="md">{`Review Signed Documents`}</Heading>
        </Box>
        <Box padding={3}>
          <SignedList />
        </Box>
      </Container> */}
    </div>
  );
};
export default Welcome;
