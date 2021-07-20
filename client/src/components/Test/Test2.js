import React, { useEffect, useState } from 'react';
import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';

const Test2 = () => {
  useEffect(() => {
  }, []);

  return (
    <div
        style={{
        background: '#F5F7FA',
        }}
    >
        <PageContainer
        header={{
            title: 'aaa',
            ghost: true,
            breadcrumb: {
            routes: [
                {
                path: '',
                breadcrumbName: '서명요청',
                },
                {
                path: '',
                breadcrumbName: '문서업로드',
                },
            ],
            },
            extra: [
            // <Button key="1">次要按钮</Button>,
            // <Button key="2">次要按钮</Button>,
            // <Button key="3" type="primary">
            //     主要按钮
            // </Button>,
            // <Dropdown
            //     key="dropdown"
            //     trigger={['click']}
            //     overlay={
            //     <Menu>
            //         <Menu.Item key="1">下拉菜单</Menu.Item>
            //         <Menu.Item key="2">下拉菜单2</Menu.Item>
            //         <Menu.Item key="3">下拉菜单3</Menu.Item>
            //     </Menu>
            //     }
            // >
            //     <Button key="4" style={{ padding: '0 8px' }}>
            //     <EllipsisOutlined />
            //     </Button>
            // </Dropdown>,
            ],
        }}
        tabList={[
            {
            tab: '내 컴퓨터',
            key: 'computer',
            closable: false,
            },
            {
            tab: '템플릿',
            key: 'template',
            },
        ]}
        tabProps={{
            type: 'editable-card',
            hideAdd: true,
            onEdit: (e, action) => console.log(e, action),
        }}
        footer={[
            <Button key="3">취소</Button>,
            <Button key="2" type="primary">
            다음
            </Button>,
        ]}
        >
        <ProCard direction="column" ghost gutter={[0, 16]}>
            <ProCard style={{ height: 200 }} />
            <ProCard gutter={16} ghost style={{ height: 200 }}>
            <ProCard colSpan={16} />
            <ProCard colSpan={8} />
            
            </ProCard>
        </ProCard>
        </PageContainer>
    </div>
  );
};

export default Test2;