import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import styled from 'styled-components';
import { useIntl } from "react-intl";
import { navigate } from '@reach/router';

const HeaderArea = styled.div`
    position: relative;
    width: 100%;
    height: 50px;
`;

const HeaderWrap = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 50px;
    transition: 0.4s ease;
    background-color: yellow;
    &.hide {
        transform: translateY(-50px);
    }
`;

const throttle = function (callback, waitTime) {
    let timerId = null;
    return (e) => {
        if (timerId) return;
        timerId = setTimeout(() => {
            callback.call(this, e);
            timerId = null;
        }, waitTime);
    };
};

const SignHeader = () => {


    const [sticky, setSticky] = useState("");

    const { formatMessage } = useIntl();

    const [hide, setHide] = useState(false);
    const [pageY, setPageY] = useState(0);
    const documentRef = useRef(document);

    const handleScroll = () => {
        const { pageYOffset } = window;
        const deltaY = pageYOffset - pageY;
        // const hide = pageYOffset !== 0 && deltaY >= 0;
        const hide = pageYOffset === 0 && deltaY <= 0;
        setHide(hide);
        setPageY(pageYOffset);
    };

    const throttleScroll = throttle(handleScroll, 50);

    useEffect(() => {
        documentRef.current.addEventListener('scroll', throttleScroll);
        return () => documentRef.current.removeEventListener('scroll', throttleScroll);
    }, [pageY]);

    return (

        <HeaderArea>
            <HeaderWrap className={hide && 'hide'}>
                <Button key="3" onClick={() => {navigate(`/documentList`);}}>{formatMessage({id: 'document.list'})}</Button>
            </HeaderWrap>
        </HeaderArea>
    );
};

export default SignHeader;