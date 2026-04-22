import fetch, { type Response } from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function listEmployees(token: string) {
  const res = await fetch(`${API_URL}/api/pro/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await json(res);
  if (!res.ok) {
    throw new Error(`Employees list failed (${res.status}) - ${JSON.stringify(data)}`);
  }
  if (!Array.isArray(data)) {
    throw new Error("Employees list response is not an array");
  }
  return data;
}

async function main() {
  try {
    const auth = await loginPro();
    const suffix = uniqueSuffix();

    const createPayload = {
      displayName: `Employé CRUD ${suffix}`,
      firstName: "Employé",
      lastName: "CRUD",
      roleLabel: "Assistant",
      phone: `+24107${suffix.slice(-7)}`,
      email: `employee-crud-${suffix}@ambya.com`,
    };

    const createRes = await fetch(`${API_URL}/api/pro/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    const created = await json(createRes);
    if (!createRes.ok) {
      throw new Error(`Employee create failed (${createRes.status}) - ${JSON.stringify(created)}`);
    }

    if (!created?.id) {
      throw new Error("Employee create response missing id");
    }

    const employeeId = created.id as string;

    const employeesAfterCreate = await listEmployees(auth.accessToken);
    const createdInList = employeesAfterCreate.find((e: any) => e.id === employeeId);
    if (!createdInList) {
      throw new Error("Created employee not found in list");
    }

    const updateRes = await fetch(`${API_URL}/api/pro/employees/${employeeId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Employé CRUD Test Modifié",
        roleLabel: "Manager adjoint",
      }),
    });

    const updated = await json(updateRes);
    if (!updateRes.ok) {
      throw new Error(`Employee update failed (${updateRes.status}) - ${JSON.stringify(updated)}`);
    }

    if (updated.displayName !== "Employé CRUD Test Modifié") {
      throw new Error("Employee displayName was not updated");
    }

    const absentRes = await fetch(`${API_URL}/api/pro/employees/${employeeId}/mark-absent`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: new Date().toISOString(),
        reason: "Test absence automatique",
      }),
    });

    const absent = await json(absentRes);
    if (!absentRes.ok) {
      throw new Error(`Employee mark absent failed (${absentRes.status}) - ${JSON.stringify(absent)}`);
    }

    if (!absent?.employeeId || absent.employeeId !== employeeId) {
      throw new Error("Absence record is invalid");
    }

    const activeRes = await fetch(`${API_URL}/api/pro/employees/${employeeId}/mark-active`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const activated = await json(activeRes);
    if (!activeRes.ok) {
      throw new Error(`Employee mark active failed (${activeRes.status}) - ${JSON.stringify(activated)}`);
    }

    if (activated.status !== "ACTIVE") {
      throw new Error("Employee was not reactivated");
    }

    const duplicateRes = await fetch(`${API_URL}/api/pro/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: `Employé duplicate ${suffix}`,
        phone: createPayload.phone,
        email: `employee-duplicate-${suffix}@ambya.com`,
      }),
    });

    const duplicateData = await json(duplicateRes);
    if (duplicateRes.ok) {
      throw new Error("Duplicate phone should have failed");
    }

    const removeRes = await fetch(`${API_URL}/api/pro/employees/${employeeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const removed = await json(removeRes);
    if (!removeRes.ok) {
      throw new Error(`Employee remove failed (${removeRes.status}) - ${JSON.stringify(removed)}`);
    }

    if (removed.status !== "INACTIVE" || removed.isActive !== false) {
      throw new Error("Employee soft delete did not set inactive state");
    }

    const employeesAfterRemove = await listEmployees(auth.accessToken);
    const removedInList = employeesAfterRemove.find((e: any) => e.id === employeeId);
    if (!removedInList) {
      throw new Error("Removed employee should still exist in list as inactive");
    }

    console.log("✅ PRO EMPLOYEES CRUD CHECK PASSED");
    console.log({
      createdId: employeeId,
      updatedName: updated.displayName,
      absenceId: absent.id ?? null,
      finalStatus: removed.status,
      isActive: removed.isActive,
      duplicatePhoneError: duplicateData?.message ?? null,
    });
  } catch (error) {
    console.error("❌ PRO EMPLOYEES CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();