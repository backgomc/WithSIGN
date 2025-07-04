import { useMemo } from "react"
import { useIntl } from "react-intl";
import Icon, { CopyOutlined, FileAddOutlined, SettingOutlined, FileTextOutlined, FileDoneOutlined } from '@ant-design/icons';

export default function useData() {
  const { formatMessage } = useIntl();
  const sidebarData = useMemo(() => [{
    "icon": FileAddOutlined,
    "key": "assign",
    "label": formatMessage({id: 'document.assign'}),
    "url": "/uploadDocument"
  // }, {
  //   "icon": FileTextOutlined,
  //   "key": "sign",
  //   "label": formatMessage({id: 'document.sign'}),
  //   "url": "/signList"
  // }, {
  //   "icon": FileDoneOutlined,
  //   "key": "signedList",
  //   "label": formatMessage({id: 'document.signed'}),
  //   "url": "/signedList"
  }, {
    "icon": FileTextOutlined,
    "key": "documentList",
    "label": formatMessage({id: 'document.list'}),
    "url": "/documentList"
  }, {
    "icon": FileTextOutlined,
    "key": "massList",
    "label": formatMessage({id: 'document.massList'}),
    "url": "/massList"
  }, {
  //   "icon": "area-chart",
  //   "key": "sub-res",
  //   "label": formatMessage({id: 'FirstLevel'}),
  //   "children": [{
  //     "key": "users",
  //     "label": formatMessage({id: 'SecondLevel'}) + "001",
  //     "url": "/home/users"
  //   }, { 
  //     "key": "hms",
  //     "label": formatMessage({id: 'SecondLevel'}) + "002",
  //     "url": "/home/hms"
  //   }, {
  //     "key": "mm",
  //     "label": formatMessage({id: 'SecondLevel'}) + "003",
  //     "url": "/home/mm"
  //   }]
  // }, {
    "icon": CopyOutlined,
    "key": "template",
    "label": formatMessage({id: 'document.template'}),
    "url": "/template"
  // }, {
  //   "icon": CopyOutlined,
  //   "key": "editSign",
  //   "label": formatMessage({id: 'document.editSign'}),
  //   "url": "/editSign"
  }, {
    "icon": SettingOutlined,
    "key": "setting",
    "label": formatMessage({id: 'Setting'}),
    "url": "/setting"
  }]);

  return sidebarData;
};