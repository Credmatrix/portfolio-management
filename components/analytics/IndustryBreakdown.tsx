import { IndustryBreakdownChart } from "./IndustryBreakdownChart";
import { IndustryBreakdownData } from "@/types/analytics.types";
import { IndustryBreakdownClickData } from "@/types/chart-interactions.types";

interface IndustryBreakdownProps {
    data: IndustryBreakdownData;
    showRiskOverlay?: boolean;
    onIndustryClick?: (data: IndustryBreakdownClickData) => void;
    activeIndustries?: string[];
    isInteractive?: boolean;
    isLoading?: boolean;
}

export function IndustryBreakdown(props: IndustryBreakdownProps) {
    return <IndustryBreakdownChart {...props} />;
}
