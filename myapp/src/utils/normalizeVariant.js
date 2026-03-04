export const normalizeVariant = (v = "") => {
    const m = {
        success: "success", succeeded: "success", completed: "success", active: "success", approved: "success",
        pending: "pending", queued: "pending", processing: "pending", waiting: "pending",
        failed: "failed", error: "failed", rejected: "failed", expired: "failed",
        indigo: "indigo",
    };
    return m[String(v).toLowerCase().trim()] ?? "default";
};