import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Grid, Card, CardContent, Typography, Stack, Avatar, Chip,
    TextField, IconButton, Divider, Paper,
    List, ListItemButton, ListItemIcon, ListItemText, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tooltip,
} from '@mui/material';
import {
    IconSend, IconRobot, IconUser, IconBulb, IconBook,
    IconAlertTriangle, IconClock, IconShieldCheck, IconChevronRight,
    IconHeadset, IconMessageCircle, IconHelp, IconCirclePlus,
    IconListCheck, IconReportAnalytics, IconTrash, IconRefresh,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useSendChatMessageMutation } from 'src/slices/chatApiSlice';
import { toast } from 'react-toastify';

/* ─── Knowledge Base: Student Topics ────────────────────────────────── */
const STUDENT_KB = [
    {
        keywords: ['negative marking', 'minus marks', 'wrong answer penalty', 'negative marks'],
        answer: '📉 **Negative Marking:**\n\nIf enabled by your teacher, incorrect answers will deduct marks from your total. The penalty (e.g. -0.5 or -1) is shown on the exam instructions page. Skipping a question results in **0 marks** (no penalty). Always double-check before choosing!',
    },
    {
        keywords: ['internet disconnected', 'wifi lost', 'offline', 'no internet'],
        answer: '🌐 **Internet issues?**\n\n- don\'t worry! Your progress is saved locally and synced every 30 seconds.\n- If you disconnect, keep the tab open. Once internet returns, click **Sync** or refresh.\n- If you can\'t reconnect before the timer ends, contact your teacher immediately.',
    },
    {
        keywords: ['subjective question', 'theory answer', 'long answer', 'typing answer'],
        answer: '✍️ **Subjective Questions:**\n\n- Type your answer in the provided text area.\n- These questions are **not auto-graded**. Your teacher will review and grade them manually.\n- Your final score will update only after the teacher completes the review.',
    },
    {
        keywords: ['exam not loading', 'exam load', 'page blank', 'blank page', 'stuck loading'],
        answer: '🔄 **Exam Not Loading?**\n\n1. Refresh the page (F5 or Ctrl+R).\n2. Clear browser cache: Ctrl+Shift+Delete → Clear cache.\n3. Switch to **Chrome** or **Edge** (best compatibility).\n4. Disable ad-blockers or extensions temporarily.\n5. Check your internet connection.\n\nIf the issue persists, click **"🚨 Report an Issue"** on your exam page.',
    },
    {
        keywords: ['camera not working', 'webcam', 'camera access', 'camera denied', 'no camera'],
        answer: '📷 **Camera Not Working?**\n\n1. Click the 🔒 padlock in the address bar → Allow Camera.\n2. Only one tab/app should use the camera — close other apps.\n3. Refresh the page after granting permission.\n4. Laptop users: check if webcam is enabled (Fn key).\n5. Go to browser Settings → Privacy → Camera → allow this site.',
    },
    {
        keywords: ['submit', 'how to submit', 'submit exam', 'finish exam'],
        answer: '✅ **How to Submit the Exam:**\n\n1. Answer all questions (you can skip and come back).\n2. Click **"Finish Test"** in the right sidebar.\n3. A confirmation dialog appears — confirm to submit.\n4. You will be redirected to your results page.\n\n⚠️ Once submitted, answers cannot be changed.',
    },
    {
        keywords: ['timer', 'time running out', 'time limit', 'clock', 'auto submit time'],
        answer: '⏱️ **About the Exam Timer:**\n\nThe countdown timer is visible in the sidebar. When time runs out, your exam is **auto-submitted** with your current answers. Your progress is checkpointed every time you answer — if you refresh, time resumes from where you left off.',
    },
    {
        keywords: ['otp', 'forgot password', 'reset password', 'password reset', 'cant login'],
        answer: '🔑 **Forgot Password?**\n\n1. On the Login page, click **"Forgot Password?"**\n2. Enter your registered email → click **Send OTP**.\n3. Check your inbox for a 6-digit OTP (valid 10 minutes).\n4. Enter the OTP → set your new password.\n\nCheck spam/junk if you don\'t see the email.',
    },
    {
        keywords: ['cheat', 'fullscreen', 'violation', 'warning', 'leave exam', 'tab switch'],
        answer: '⚠️ **Exam Violation Warning:**\n\nThe exam uses fullscreen lockdown. Violations are triggered when you:\n- Switch tabs or windows\n- Exit fullscreen\n- Minimize the browser\n\nYou get **3 warnings** before auto-submission. Stay in the exam tab at all times.',
    },
    {
        keywords: ['qr code', 'third eye', 'mobile camera', 'phone camera', 'scan qr'],
        answer: '📱 **Third Eye (Mobile Camera) Setup:**\n\n1. When the QR dialog appears, scan it with your phone camera.\n2. Allow camera access on your phone.\n3. The dialog closes automatically when connected.\n\nYou can click **"Skip"** to proceed without mobile camera if your exam allows it.',
    },
    {
        keywords: ['result', 'score', 'marks', 'my results', 'check result'],
        answer: '📊 **Checking Your Results:**\n\n- Go to **My Results** in the sidebar.\n- All completed exams with score and pass/fail are shown.\n- Results appear immediately after submission.',
    },
    {
        keywords: ['technical error', 'error during exam', 'crash', 'report issue', 'something wrong'],
        answer: '🛠️ **Technical Error During Exam:**\n\n1. **Don\'t panic** — answers are auto-saved as checkpoints.\n2. Refresh the page — your progress will be restored.\n3. If the error persists, click **"🚨 Report an Issue"** in the exam sidebar.\n4. Describe the issue and submit — your teacher will be notified.\n\nYour exam session is preserved for up to 4 hours.',
    },
];

/* ─── Knowledge Base: Teacher Topics ────────────────────────────────── */
const TEACHER_KB = [
    {
        keywords: ['export results', 'download csv', 'export data', 'get excel'],
        answer: '📊 **Exporting Results:**\n\n1. Go to **Exam Logs**.\n2. Click the **"Download CSV"** button at the top-right.\n3. This exports a full list of student scores, percentages, and basic proctoring data to an Excel-friendly format.',
    },
    {
        keywords: ['manual grading', 'grade subjective', 'review answers', 'mark subjective'],
        answer: '✍️ **Manual Grading Guide:**\n\n1. Go to **Exam Logs** → click **View Details** (eye icon) for a student.\n2. Locate subjective answers.\n3. Click **"Submit Score"** after entering marks for those specific questions.\n4. The student\'s final score will automatically recalculate.',
    },
    {
        keywords: ['monitor live', 'realtime monitor', 'live proctoring', 'who is taking exam'],
        answer: '👀 **Real-time Monitoring:**\n\n- The **Exam Log** updates live. You can see who is currently in an exam session and their last sync time.\n- If **Third Eye** is active, you can click on the proctoring row to see their mobile camera view in real-time.',
    },
    {
        keywords: ['create exam', 'how to create', 'new exam', 'make exam', 'set up exam'],
        answer: '📝 **How to Create an Exam:**\n\n1. Click **"Create Exam"** in the sidebar.\n2. Fill in:\n   - **Exam Name** — e.g. "Math Mid-Term"\n   - **Duration** — in minutes\n   - **Live Date** — when students can start\n   - **Dead Date** — when the exam closes\n   - **Total Questions** — how many questions you plan to add\n3. Toggle **Third Eye** ON if you want mobile room monitoring.\n4. Click **Create** — the exam appears in the list immediately.\n\n✅ After creating, go to **Add Questions** to add MCQs.',
    },
    {
        keywords: ['add questions', 'add question', 'mcq', 'options', 'correct answer', 'question bank'],
        answer: '❓ **How to Add Questions:**\n\n1. Go to **Add Questions** in the sidebar.\n2. Select the exam from the dropdown.\n3. Fill in:\n   - **Question Text**\n   - **4 answer options** (A, B, C, D)\n   - Tick the **correct answer** checkbox\n4. Click **Add Question** — it saves instantly.\n5. Repeat for all questions.\n\n💡 Tip: Add at least as many questions as the "Total Questions" count you set when creating the exam.',
    },
    {
        keywords: ['exam log', 'exam logs', 'view results', 'student results', 'cheating log', 'proctoring data'],
        answer: '📋 **Exam Logs:**\n\n- Go to **Exam Logs** in the sidebar.\n- See all exam submissions with:\n  - Student name & email\n  - Score & percentage\n  - Cheating log details (face missing, multiple faces, phone detected, etc.)\n- Use this to review suspicious submissions.',
    },
    {
        keywords: ['delete exam', 'remove exam', 'edit exam'],
        answer: '🗑️ **Delete / Edit Exam:**\n\nCurrently you can **delete** an exam from the Create Exam or exam list area using the delete button. Editing exam details after creation is not yet supported — delete and recreate if needed.\n\n⚠️ Deleting an exam also removes all associated questions.',
    },
    {
        keywords: ['third eye', 'mobile proctoring', 'enable third eye', 'room monitoring'],
        answer: '📱 **Third Eye (Room Monitoring):**\n\nWhen creating an exam, toggle **"Require Third Eye"** ON.\n\nStudents will see a QR code when starting the exam — they scan it with their phone to enable a 360° room camera view that you can see in the Exam Log.\n\n💡 For this to work, the app must be served on a local IP (not localhost) so phones on the same Wi-Fi can connect.',
    },
    {
        keywords: ['student report', 'issue report', 'reported issue', 'student complaint'],
        answer: '🚨 **Viewing Student Issue Reports:**\n\nGo to the **Support** page (sidebar) and scroll to the **Student Issue Reports** section at the bottom.\n\nYou will see all reports submitted by students during exams, including:\n- Student name & email\n- Which exam\n- Issue type & description\n- Time reported\n\nClick **"Clear All"** to remove resolved reports.',
    },
    {
        keywords: ['hello', 'hi', 'hey', 'help'],
        answer: '👋 **Hi Teacher! I\'m SAAN Assistant.**\nI can help you with:\n- 📝 Creating exams & adding questions\n- 📋 Viewing exam logs & results\n- 📱 Setting up Third Eye (mobile proctoring)\n- 🚨 Viewing student issue reports\n- 🗑️ Managing exams\nJust type your question!',
    },
];

const STUDENT_GREETING = `👋 **Hi! I'm SAAN Assistant.** 

I can help you with:
- 📖 **How to attempt the exam**
- 📷 **Camera & technical issues**
- ⏱️ **Exam timer & submission**
- 🔑 **Password & login problems**
- 📊 **Checking results**

Type your question or pick a topic from the left!`;

const findAnswer = (input, isTeacher) => {
    const lower = input.toLowerCase();
    const kb = isTeacher ? [...TEACHER_KB, ...STUDENT_KB] : STUDENT_KB;
    for (const entry of kb) {
        if (entry.keywords.some((kw) => lower.includes(kw))) return entry.answer;
    }
    return "🤔 I'm not sure about that. Try rephrasing or pick a topic from the left.\n\nFor urgent exam issues, use the **🚨 Report an Issue** button on the exam page.";
};

/* ─── Message bubble ─────────────────────────────────────────────────── */
const MsgBubble = ({ msg }) => {
    const isBot = msg.role === 'bot';
    const handleCopy = (t) => {
        navigator.clipboard.writeText(t);
        toast.success("Copied to clipboard!");
    };

    return (
        <Stack direction={isBot ? 'row' : 'row-reverse'} spacing={1.5} alignItems="flex-start" mb={2}>
            <Avatar sx={{
                width: 36, height: 36, flexShrink: 0, borderRadius: '12px',
                background: isBot ? 'linear-gradient(135deg,#6C63FF,#A855F7)' : 'linear-gradient(135deg,#00D4AA,#00B894)',
            }}>
                {isBot ? <IconRobot size={20} color="#fff" /> : <IconUser size={20} color="#fff" />}
            </Avatar>
            <Box sx={{
                maxWidth: '78%',
                bgcolor: isBot ? 'rgba(108,99,255,0.06)' : 'rgba(0,212,170,0.06)',
                border: isBot ? '1px solid rgba(108,99,255,0.12)' : '1px solid rgba(0,212,170,0.15)',
                borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                px: 2, py: 1.5,
                position: 'relative',
                '&:hover .copy-btn': { opacity: 1 }
            }}>
                {msg.text.split('\n').map((line, i) => {
                    if (line.trim() === '') return <Box key={i} sx={{ height: '8px' }} />;
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                        <Typography key={i} variant="body2" sx={{ lineHeight: 1.6, mb: 0.5 }}>
                            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
                        </Typography>
                    );
                })}
                {isBot && (
                    <IconButton 
                        size="small" 
                        className="copy-btn"
                        onClick={() => handleCopy(msg.text)}
                        sx={{ position: 'absolute', top: 2, right: 2, opacity: 0, transition: '0.2s' }}
                    >
                        <Typography variant="caption" sx={{ fontSize: '10px' }}>📋</Typography>
                    </IconButton>
                )}
            </Box>
        </Stack>
    );
};

/* ─── FAQ Topics ─────────────────────────────────────────────────────── */
const STUDENT_TOPICS = [
    { icon: IconBook, label: 'How to take an exam', q: 'how to submit exam' },
    { icon: IconAlertTriangle, label: 'Technical errors', q: 'technical error during exam' },
    { icon: IconClock, label: 'Timer & auto-submit', q: 'timer auto submit time' },
    { icon: '📷', label: 'Camera issues', q: 'camera not working' },
    { icon: IconShieldCheck, label: 'Violation warnings', q: 'cheat violation warning' },
    { icon: IconBulb, label: 'Forgot password', q: 'forgot password reset' },
    { icon: IconBook, label: 'Check my results', q: 'result score marks' },
];

const TEACHER_TOPICS = [
    { icon: IconCirclePlus, label: 'How to create an exam', q: 'how to create exam' },
    { icon: IconListCheck, label: 'How to add questions', q: 'how to add questions' },
    { icon: IconReportAnalytics, label: 'View exam logs', q: 'exam log view results' },
    { icon: '📱', label: 'Third Eye setup', q: 'enable third eye mobile proctoring' },
    { icon: IconAlertTriangle, label: 'Student issue reports', q: 'student report issue reported' },
    { icon: '🗑️', label: 'Delete / edit exam', q: 'delete exam remove' },
    { icon: IconBulb, label: 'Forgot password', q: 'forgot password reset' },
];

/* ─── Issue severity badge color ─────────────────────────────────────── */
const issueSeverity = (type) => {
    if (['Page crashed or froze', 'Cannot submit exam'].includes(type)) return '#ef4444';
    if (['Camera not working', 'Internet disconnected'].includes(type)) return '#f59e0b';
    return '#6C63FF';
};

/* ─── Support Cards at top ───────────────────────────────────────────── */
const SUPPORT_CARDS = [
    { icon: IconMessageCircle, label: 'AI Chatbot', desc: 'Instant 24/7 answers', gradient: 'linear-gradient(135deg,#6C63FF,#A855F7)' },
    { icon: IconAlertTriangle, label: 'Report Issue', desc: 'During active exams', gradient: 'linear-gradient(135deg,#FF6B6B,#EE5253)' },
    { icon: IconHelp, label: 'Quick FAQs', desc: 'Browse common topics', gradient: 'linear-gradient(135deg,#F59E0B,#F97316)' },
];

/* ─── Main Support Page ──────────────────────────────────────────────── */
const SupportPage = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const isTeacher = userInfo?.role === 'teacher';

    const topics = isTeacher ? TEACHER_TOPICS : STUDENT_TOPICS;
    const initGreeting = isTeacher
        ? '👋 **Hi Teacher! I\'m SAAN Assistant.**\nI can help you with:\n- 📝 Creating exams & adding questions\n- 📋 Viewing exam logs & results\n- 📱 Third Eye mobile proctoring setup\n- 🚨 Viewing student issue reports\nType your question or pick a topic from the left!'
        : STUDENT_GREETING;

    const [messages, setMessages] = useState([{ role: 'bot', text: initGreeting }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [issueReports, setIssueReports] = useState([]);
    const bottomRef = useRef(null);

    // Load issue reports from localStorage (only relevant for teachers)
    const loadReports = () => {
        const saved = JSON.parse(localStorage.getItem('examIssueReports') || '[]');
        setIssueReports(saved.reverse()); // newest first
    };

    useEffect(() => {
        if (isTeacher) loadReports();
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isTeacher, messages, isTyping]);

    const [sendChatMessage] = useSendChatMessageMutation();

    const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg) return;
        
        setInput('');
        
        // Append user's message immediately for UI responsiveness
        const newMessages = [...messages, { role: 'user', text: msg }];
        setMessages(newMessages);
        setIsTyping(true);
        
        try {
            // Keep history length reasonable, filter out initial generic greeting if wanted, 
            // but let's send the last 10 messages to give context 
            const recentHistory = newMessages.slice(-10);
            
            const res = await sendChatMessage({
                messages: recentHistory,
                userRole: userInfo?.role || 'student',
                userName: userInfo?.name || 'User'
            }).unwrap();

            setMessages((prev) => [...prev, { role: 'bot', text: res.reply }]);
        } catch (error) {
            console.error(error);
            // Display real error from backend or a generic fallback
            const errDetail = error.data?.message || "Please try again later.";
            let fallbackMsg = `🚨 **SAAN Assistant is having trouble connecting.**\n\n${errDetail}\n\n---\n**Static Search Result:**\n`;
            fallbackMsg += findAnswer(msg, isTeacher);
            setMessages((prev) => [...prev, { role: 'bot', text: fallbackMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    const clearReports = () => {
        localStorage.removeItem('examIssueReports');
        setIssueReports([]);
    };

    const removeReport = (idx) => {
        const updated = [...issueReports];
        updated.splice(idx, 1);
        // Save back in original (newest-first) order
        localStorage.setItem('examIssueReports', JSON.stringify([...updated].reverse()));
        setIssueReports(updated);
    };

    const QUICK_CHIPS = isTeacher
        ? ['Create exam', 'Add questions', 'View exam logs', 'Third Eye setup']
        : ['Camera issue', 'Submit exam', 'Reset password', 'Technical error'];

    return (
        <PageContainer title="Support — SAAN AI" description="Help & Support Center">

            {/* Header */}
            <Box mb={4} sx={{ animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
                <Stack direction="row" alignItems="center" spacing={2.5} mb={0.5}>
                    <Avatar sx={{ width: 56, height: 56, background: 'linear-gradient(135deg,#6C63FF,#A855F7)', borderRadius: '16px', boxShadow: '0 8px 16px rgba(108,99,255,0.25)' }}>
                        <IconHeadset size={30} color="#fff" />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight={800} letterSpacing="-0.5px">
                            Help &{' '}
                            <Box component="span" sx={{ background: 'linear-gradient(90deg,#6C63FF,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                Support
                            </Box>
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight={500} mt={0.5}>
                            {isTeacher ? 'Teacher guides, tools & student issue reports' : 'Ask the intelligent assistant or browse common topics'}
                        </Typography>
                    </Box>
                    {isTeacher && (
                        <Chip
                            label="Teacher View"
                            size="medium"
                            sx={{ ml: 'auto', bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 800, border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px' }}
                        />
                    )}
                </Stack>
            </Box>

            {/* Support stat cards */}
            <Grid container spacing={3} mb={4}>
                {SUPPORT_CARDS.map((c, i) => (
                    <Grid item xs={12} sm={4} key={c.label}>
                        <Card elevation={4} sx={{
                            borderRadius: '18px', overflow: 'hidden',
                            animation: 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
                            animationDelay: `${i * 0.1}s`,
                            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 16px 40px rgba(108,99,255,0.15)' },
                        }}>
                            <Box sx={{ height: '4px', background: c.gradient }} />
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ width: 48, height: 48, background: c.gradient, borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <c.icon size={24} color="#fff" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={800}>{c.label}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{c.desc}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Main layout: FAQ sidebar + Chat */}
            <Grid container spacing={3}>
                {/* FAQ Topics sidebar */}
                <Grid item xs={12} md={4}>
                    <Card elevation={4} sx={{
                        borderRadius: '18px',
                        animation: 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both',
                        height: '100%',
                    }}>
                        <Box sx={{ height: '4px', background: isTeacher ? 'linear-gradient(90deg,#F59E0B,#F97316)' : 'linear-gradient(90deg,#6C63FF,#A855F7)' }} />
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <IconBulb size={20} color={isTeacher ? '#F59E0B' : '#6C63FF'} />
                                <Typography variant="h6" fontWeight={700}>
                                    {isTeacher ? 'Teacher Topics' : 'Browse Topics'}
                                </Typography>
                            </Stack>
                            <List disablePadding>
                                {topics.map((t, i) => (
                                    <React.Fragment key={t.label}>
                                        <ListItemButton
                                            onClick={() => sendMessage(t.q)}
                                            sx={{ borderRadius: '12px', py: 1.2, '&:hover': { bgcolor: 'rgba(108,99,255,0.06)' } }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {typeof t.icon === 'string'
                                                    ? <Typography fontSize="1.1rem">{t.icon}</Typography>
                                                    : <t.icon size={18} color={isTeacher ? '#F59E0B' : '#6C63FF'} />
                                                }
                                            </ListItemIcon>
                                            <ListItemText primary={t.label} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                                            <IconChevronRight size={16} color="#aaa" />
                                        </ListItemButton>
                                        {i < topics.length - 1 && <Divider sx={{ opacity: 0.4 }} />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Chatbot */}
                <Grid item xs={12} md={8}>
                    <Card elevation={4} sx={{
                        borderRadius: '18px', display: 'flex', flexDirection: 'column', height: 600,
                        animation: 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both',
                        border: '1px solid rgba(108,99,255,0.08)',
                    }}>
                        <Box sx={{ height: '4px', background: 'linear-gradient(90deg,#6C63FF,#A855F7,#EC4899,#6C63FF)', backgroundSize: '300% 100%', animation: 'gradientShift 4s linear infinite', borderRadius: '18px 18px 0 0' }} />

                        {/* Chat header */}
                        <Box px={3} py={2} borderBottom="1px solid" borderColor="divider">
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar sx={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6C63FF,#A855F7)', borderRadius: '12px' }}>
                                    <IconRobot size={20} color="#fff" />
                                </Avatar>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" flex={1}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>SAAN Assistant</Typography>
                                        <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} /> Online • Always available
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={() => setMessages([{ role: 'bot', text: initGreeting }])} color="error" size="small">
                                        <Tooltip title="Clear Chat">
                                            <IconTrash size={18} />
                                        </Tooltip>
                                    </IconButton>
                                </Stack>
                                <Chip label="AI Powered" size="small" sx={{ bgcolor: 'rgba(108,99,255,0.1)', color: '#6C63FF', fontWeight: 700, fontSize: '0.68rem' }} />
                            </Stack>
                        </Box>

                        {/* Messages */}
                        <Box flex={1} sx={{ overflowY: 'auto', px: 3, py: 2 }}>
                            {messages.map((msg, i) => <MsgBubble key={i} msg={msg} />)}
                            {isTyping && (
                                <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
                                    <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6C63FF,#A855F7)', borderRadius: '12px', flexShrink: 0 }}>
                                        <IconRobot size={20} color="#fff" />
                                    </Avatar>
                                    <Box sx={{ bgcolor: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)', borderRadius: '4px 16px 16px 16px', px: 2, py: 1.5 }}>
                                        <Stack direction="row" spacing={0.5}>
                                            {[0, 1, 2].map((d) => (
                                                <Box key={d} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6C63FF', animation: 'pulseGlow 1.2s ease-in-out infinite', animationDelay: `${d * 0.2}s` }} />
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            )}
                            <div ref={bottomRef} />
                        </Box>

                        {/* Quick chips */}
                        <Box px={3} pb={1}>
                            <Stack direction="row" flexWrap="wrap" gap={0.8}>
                                {QUICK_CHIPS.map((q) => (
                                    <Chip key={q} label={q} size="small" clickable onClick={() => sendMessage(q)}
                                        sx={{ fontSize: '0.72rem', bgcolor: 'rgba(108,99,255,0.07)', color: '#6C63FF', fontWeight: 600, '&:hover': { bgcolor: 'rgba(108,99,255,0.15)' } }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        {/* Input */}
                        <Box px={3} pb={3} pt={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    fullWidth placeholder="Type your question..."
                                    value={input} onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    multiline maxRows={3} size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'rgba(108,99,255,0.04)', '&.Mui-focused fieldset': { borderColor: '#6C63FF' } } }}
                                />
                                <IconButton onClick={() => sendMessage()} disabled={!input.trim()}
                                    sx={{ width: 44, height: 44, background: input.trim() ? 'linear-gradient(135deg,#6C63FF,#A855F7)' : 'rgba(108,99,255,0.1)', borderRadius: '12px', transition: 'background 0.3s' }}>
                                    <IconSend size={18} color={input.trim() ? '#fff' : '#6C63FF'} />
                                </IconButton>
                            </Stack>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Teacher-only: Student Issue Reports ──────────────────────── */}
            {isTeacher && (
                <Box mt={4} sx={{ animation: 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
                    <Card elevation={4} sx={{ borderRadius: '18px', border: '1px solid rgba(255,107,107,0.15)' }}>
                        <Box sx={{ height: '4px', background: 'linear-gradient(90deg,#FF6B6B,#EE5253)' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Avatar sx={{ width: 42, height: 42, background: 'linear-gradient(135deg,#FF6B6B,#EE5253)', borderRadius: '13px' }}>
                                        <IconAlertTriangle size={22} color="#fff" />
                                    </Avatar>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="h5" fontWeight={800}>Student Issue Reports</Typography>
                                            {issueReports.length > 0 && (
                                                <Chip label={issueReports.length} size="small" sx={{ bgcolor: '#FF6B6B', color: '#fff', fontWeight: 800, minWidth: 28, height: 22, fontSize: '0.75rem' }} />
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">Issues reported by students during exams</Typography>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Refresh">
                                        <IconButton onClick={loadReports} size="small" sx={{ bgcolor: 'rgba(108,99,255,0.08)', borderRadius: '10px' }}>
                                            <IconRefresh size={18} color="#6C63FF" />
                                        </IconButton>
                                    </Tooltip>
                                    {issueReports.length > 0 && (
                                        <Button
                                            onClick={clearReports}
                                            size="small"
                                            variant="outlined"
                                            startIcon={<IconTrash size={16} />}
                                            sx={{ borderRadius: '10px', color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.4)', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'rgba(255,107,107,0.06)', borderColor: '#FF6B6B' } }}
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>

                            {issueReports.length === 0 ? (
                                <Box textAlign="center" py={5}>
                                    <Typography fontSize="2.5rem">✅</Typography>
                                    <Typography variant="h6" fontWeight={700} color="text.secondary" mt={1}>No issues reported</Typography>
                                    <Typography variant="body2" color="text.secondary">Students can report issues during exams using the 🚨 button in the exam sidebar.</Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '14px', border: '1px solid rgba(108,99,255,0.1)' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'rgba(108,99,255,0.04)' }}>
                                                {['Student', 'Exam', 'Issue Type', 'Description', 'Time', 'Action'].map((h) => (
                                                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.secondary', py: 1.5 }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {issueReports.map((r, i) => (
                                                <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>{r.studentName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{r.studentEmail}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>{r.examName}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={r.issueType}
                                                            size="small"
                                                            sx={{ bgcolor: `${issueSeverity(r.issueType)}18`, color: issueSeverity(r.issueType), fontWeight: 700, fontSize: '0.7rem', maxWidth: 160 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {r.description || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                            {new Date(r.reportedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="Dismiss report">
                                                            <IconButton size="small" onClick={() => removeReport(i)} sx={{ color: '#FF6B6B', '&:hover': { bgcolor: 'rgba(255,107,107,0.08)' } }}>
                                                                <IconTrash size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            )}
        </PageContainer>
    );
};

export default SupportPage;
