import {
  IconLayoutDashboard,
  IconBook,
  IconChartBar,
  IconCirclePlus,
  IconListCheck,
  IconReportAnalytics,
  IconLifebuoy,
  IconTrophy,
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Student',
  },
  {
    id: uniqueId(),
    title: 'Exams',
    icon: IconBook,
    href: '/exam',
  },
  {
    id: uniqueId(),
    title: 'Leaderboard',
    icon: IconTrophy,
    href: '/leaderboard',
  },
  {
    id: uniqueId(),
    title: 'My Results',
    icon: IconChartBar,
    href: '/my-results',
  },
  {
    id: uniqueId(),
    title: 'Support',
    icon: IconLifebuoy,
    href: '/support',
  },
  {
    navlabel: true,
    subheader: 'Teacher',
  },
  {
    id: uniqueId(),
    title: 'Create Exam',
    icon: IconCirclePlus,
    href: '/create-exam',
  },
  {
    id: uniqueId(),
    title: 'Add Questions',
    icon: IconListCheck,
    href: '/add-questions',
  },
  {
    id: uniqueId(),
    title: 'Exam Logs',
    icon: IconReportAnalytics,
    href: '/exam-log',
  },
];

export default Menuitems;
