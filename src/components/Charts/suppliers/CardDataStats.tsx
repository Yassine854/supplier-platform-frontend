import React from "react";

type CardDataStatsProps = {
  title: string;
  total: string;
  // rate: string;
  levelUp?: boolean;
  className?: string;
  children: React.ReactNode; // <-- Add this line to accept children
};

const CardDataStats = ({
  title,
  total,
  // rate,
  levelUp,
  className,
  children,
}: CardDataStatsProps) => {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0 text-4xl">{children}</div>

        {/* Title & Data */}
        <div className="ml-2 flex-grow">
          <h4 className="text-lg font-semibold text-gray-700">{title}</h4>
          <p className="text-xl font-bold text-gray-800">{total}</p>
          {/* {rate && <p className="text-sm text-green-500">{rate}</p>} */}
          {/* {levelUp && <span className="text-green-600">Level Up</span>} */}
        </div>
      </div>
    </div>
  );
};

export default CardDataStats;
