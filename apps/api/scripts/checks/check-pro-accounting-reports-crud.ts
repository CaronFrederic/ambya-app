import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

async function main() {
  try {
    const auth = await loginPro();

    const qs = new URLSearchParams({
      reportType: "compte-resultat",
      periodType: "Ce mois",
    });

    const reportRes = await fetch(`${API_URL}/api/pro/accounting-reports?${qs.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const report = await reportRes.json();

    if (!reportRes.ok) {
      throw new Error(
        `Accounting report failed (${reportRes.status}) - ${JSON.stringify(report)}`
      );
    }

    if (
      typeof report?.summary?.totalRevenue !== "number" ||
      typeof report?.summary?.totalExpenses !== "number" ||
      typeof report?.summary?.netResult !== "number"
    ) {
      throw new Error("Accounting report summary is invalid");
    }

    const invalidRes = await fetch(`${API_URL}/api/pro/accounting-reports`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const invalidData = await invalidRes.json();
    if (invalidRes.ok) {
      throw new Error("Accounting report without required params should fail");
    }

    const exportQs = new URLSearchParams({
      reportType: "compte-resultat",
      periodType: "Ce mois",
      format: "excel",
    });

    const exportRes = await fetch(
      `${API_URL}/api/pro/accounting-reports/export?${exportQs.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    const exportBuffer = Buffer.from(await exportRes.arrayBuffer());

    if (!exportRes.ok) {
      const exportText = exportBuffer.toString("utf-8");
      throw new Error(`Accounting export failed (${exportRes.status}) - ${exportText}`);
    }

    if (exportBuffer.length < 1000) {
      throw new Error("Accounting export file looks too small");
    }

    console.log("✅ PRO ACCOUNTING REPORTS CRUD CHECK PASSED");
    console.log({
      totalRevenue: report.summary.totalRevenue,
      totalExpenses: report.summary.totalExpenses,
      netResult: report.summary.netResult,
      exportSize: exportBuffer.length,
      invalidRequestError: invalidData?.message ?? null,
    });
  } catch (error) {
    console.error("❌ PRO ACCOUNTING REPORTS CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();