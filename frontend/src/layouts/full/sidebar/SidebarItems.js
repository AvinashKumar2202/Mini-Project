import React from 'react';
import Menuitems from './MenuItems';
import { useLocation } from 'react-router';
import { Box, List } from '@mui/material';
import NavItem from './NavItem';
import NavGroup from './NavGroup/NavGroup';
import { useSelector } from 'react-redux';

const SidebarItems = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const pathDirect = pathname;

  // Normalize role and add a fallback to prevent errors
  const userRole = userInfo?.role?.toLowerCase();

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {Menuitems.map((item) => {

          // 1. FILTER FOR STUDENTS: Hide teacher-specific tools
          if (
            userRole === 'student' &&
            ['Create Exam', 'Add Questions', 'Exam Logs'].includes(item.title)
          ) {
            return null;
          }

          // 2. FILTER FOR TEACHERS: Hide student-specific tools
          if (
            userRole === 'teacher' &&
            ['Exams', 'My Results'].includes(item.title)
          ) {
            return null;
          }

          // 3. HANDLE SUBHEADERS
          if (item.subheader) {
            // Hide "Teacher" header for students
            if (userRole === 'student' && item.subheader === 'Teacher') {
              return null;
            }
            // Hide "Student" header for teachers
            if (userRole === 'teacher' && item.subheader === 'Student') {
              return null;
            }

            return <NavGroup item={item} key={item.subheader} />;

          } else {
            // 4. RENDER REMAINING ITEMS
            return <NavItem item={item} key={item.id} pathDirect={pathDirect} />;
          }
        })}
      </List>
    </Box>
  );
};

export default SidebarItems;