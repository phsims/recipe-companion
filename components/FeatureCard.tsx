'use client';
import Image from 'next/image';
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export interface FeatureCardProps {
    id: number;
    title: string;
    description: string;
    imageSrc?: string;
    textColor?: string;
}

export default function FeatureCard({ id, title, description, imageSrc, textColor = 'primary.dark' }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + id * 0.1 }}
        >
            <Box
                sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                    },
                }}
            >
                {imageSrc && (
                    <Image src={imageSrc} alt={title} width={150} height={150} loading="eager" />
                )}
                <Typography variant="h3" gutterBottom color={textColor}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.primary">
                    {description}
                </Typography>
            </Box>
        </motion.div>
    )
}