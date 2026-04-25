import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Fab, Zoom, Paper, Typography, Stack, Avatar, IconButton,
    TextField, Chip, Tooltip, Divider
} from '@mui/material';
import {
    IconMessageChatbot, IconX, IconSend, IconRobot, IconUser,
    IconMinus
} from '@tabler/icons-react';
import { useSendChatMessageMutation } from 'src/slices/chatApiSlice';
import { toast } from 'react-toastify';

const SaanAIWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { userInfo } = useSelector((state) => state.auth);

    const [sendChatMessage] = useSendChatMessageMutation();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = userInfo?.role === 'teacher'
                ? `👋 **Hi Teacher! I'm SAAN Agent.** I can help you manage exams, analyze results, and monitor students. How can I assist you today?`
                : `👋 **Hi ${userInfo?.name || 'there'}! I'm SAAN Agent.** I'm here to support you during your exams. Ask me about technical issues, rules, or results!`;
            setMessages([{ role: 'bot', text: greeting }]);
        }
        scrollToBottom();
    }, [isOpen, messages]);

    const handleSendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg) return;

        setInput('');
        const newMessages = [...messages, { role: 'user', text: msg }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const res = await sendChatMessage({
                messages: newMessages.slice(-8), // Send last 8 for context
                userRole: userInfo?.role || 'student',
                userName: userInfo?.name || 'User'
            }).unwrap();

            setMessages((prev) => [...prev, { role: 'bot', text: res.reply }]);
        } catch (error) {
            console.error(error);
            toast.error("SAAN Agent is having trouble connecting.");
            setMessages((prev) => [...prev, { role: 'bot', text: "⚠️ I'm having trouble connecting right now. Please check your internet or try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const quickChips = userInfo?.role === 'teacher'
        ? ['How to see logs?', 'Create exam help', 'Cheating alerts']
        : ['Technical issue', 'Exam rules', 'How to submit?'];

    return (
        <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
            {/* Toggle Button */}
            <Tooltip title={isOpen ? "Close SAAN Assistant" : "Chat with SAAN Agent"} placement="left">
                <Fab
                    color="primary"
                    onClick={toggleChat}
                    sx={{
                        width: 60, height: 60,
                        background: 'linear-gradient(135deg,#6C63FF,#A855F7)',
                        boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        '&:hover': { transform: 'scale(1.1) rotate(5deg)' }
                    }}
                >
                    {isOpen ? <IconX size={28} /> : <IconMessageChatbot size={32} />}
                </Fab>
            </Tooltip>

            {/* Chat Window */}
            <Zoom in={isOpen}>
                <Paper
                    elevation={24}
                    sx={{
                        position: 'absolute', bottom: 80, right: 0,
                        width: { xs: 'calc(100vw - 60px)', sm: 380 },
                        height: isMinimized ? 60 : 500,
                        display: 'flex', flexDirection: 'column',
                        borderRadius: '24px', overflow: 'hidden',
                        border: '1px solid rgba(108,99,255,0.1)',
                        transition: 'height 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        bgcolor: 'rgba(255,255,255,0.98)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2, background: 'linear-gradient(90deg,#6C63FF,#A855F7)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                                <IconRobot size={20} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>SAAN Agent</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#00D4AA' }} /> Online
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row">
                            <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)} sx={{ color: '#fff' }}>
                                <IconMinus size={18} />
                            </IconButton>
                            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#fff' }}>
                                <IconX size={18} />
                            </IconButton>
                        </Stack>
                    </Box>

                    {!isMinimized && (
                        <>
                            {/* Messages area */}
                            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {messages.map((msg, i) => {
                                    const isBot = msg.role === 'bot';
                                    return (
                                        <Stack key={i} direction={isBot ? 'row' : 'row-reverse'} spacing={1} alignItems="flex-start">
                                            <Avatar sx={{
                                                width: 30, height: 30, fontSize: '0.8rem', flexShrink: 0,
                                                background: isBot ? 'linear-gradient(135deg,#6C63FF,#A855F7)' : 'linear-gradient(135deg,#00D4AA,#00B894)'
                                            }}>
                                                {isBot ? <IconRobot size={16} /> : <IconUser size={16} />}
                                            </Avatar>
                                            <Paper sx={{
                                                p: 1.5, maxWidth: '80%', borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                                                bgcolor: isBot ? 'rgba(108,99,255,0.04)' : 'rgba(0,212,170,0.04)',
                                                border: isBot ? '1px solid rgba(108,99,255,0.1)' : '1px solid rgba(0,212,170,0.1)'
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    fontSize: '0.85rem', lineHeight: 1.5,
                                                    whiteSpace: 'pre-wrap', color: 'text.primary',
                                                    '& strong': { fontWeight: 800, color: isBot ? '#6C63FF' : '#00B894' }
                                                }}>
                                                    {msg.text.split(/(\*\*.*?\*\*)/).map((part, index) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <strong key={index}>{part.slice(2, -2)}</strong>;
                                                        }
                                                        return part;
                                                    })}
                                                </Typography>
                                            </Paper>
                                        </Stack>
                                    );
                                })}
                                {isTyping && (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ width: 30, height: 30, background: 'linear-gradient(135deg,#6C63FF,#A855F7)' }}>
                                            <IconRobot size={16} />
                                        </Avatar>
                                        <Box sx={{ display: 'flex', gap: 0.5, p: 1, bgcolor: 'rgba(108,99,255,0.04)', borderRadius: '12px' }}>
                                            {[0, 1, 2].map((i) => (
                                                <Box key={i} sx={{
                                                    width: 6, height: 6, borderRadius: '50%', bgcolor: '#6C63FF',
                                                    animation: 'pulse 1.2s infinite ease-in-out', animationDelay: `${i * 0.2}s`
                                                }} />
                                            ))}
                                        </Box>
                                    </Stack>
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Quick Replies */}
                            <Box sx={{ px: 2, pb: 1 }}>
                                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 } }}>
                                    {quickChips.map((q) => (
                                        <Chip
                                            key={q} label={q} size="small" onClick={() => handleSendMessage(q)}
                                            sx={{
                                                fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(108,99,255,0.08)',
                                                color: '#6C63FF', border: '1px solid rgba(108,99,255,0.1)',
                                                '&:hover': { bgcolor: 'rgba(108,99,255,0.15)' }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <Divider />

                            {/* Input Area */}
                            <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth size="small" placeholder="Ask Saan anything..."
                                    value={input} onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.85rem' } }}
                                />
                                <IconButton
                                    disabled={!input.trim() || isTyping}
                                    onClick={() => handleSendMessage()}
                                    sx={{
                                        background: 'linear-gradient(135deg,#6C63FF,#A855F7)', color: '#fff',
                                        '&:hover': { opacity: 0.9 }, '&.Mui-disabled': { opacity: 0.5, color: '#fff' }
                                    }}
                                >
                                    <IconSend size={20} />
                                </IconButton>
                            </Box>
                        </>
                    )}
                </Paper>
            </Zoom>
        </Box>
    );
};

export default SaanAIWidget;
