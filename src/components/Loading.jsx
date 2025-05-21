import React from "react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
      />
      <div className="text-lg font-medium text-gray-700">
        Жүктеліп жатыр...
      </div>
    </motion.div>
  );
}
