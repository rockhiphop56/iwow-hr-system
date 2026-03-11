import { createServerSupabase } from "@/services/supabase/server";
import type { Tenant } from "@/types/database.types";

/** 取得當前租戶資訊 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .single();

  if (error) return null;
  return data;
}

/** 取得所有租戶（含子公司） */
export async function getAllTenants(): Promise<Tenant[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("tenant_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 建構租戶樹 */
export interface TenantTreeNode extends Tenant {
  children: TenantTreeNode[];
}

export function buildTenantTree(tenants: Tenant[]): TenantTreeNode[] {
  const map = new Map<string, TenantTreeNode>();
  const roots: TenantTreeNode[] = [];

  tenants.forEach((t) => {
    map.set(t.tenant_id, { ...t, children: [] });
  });

  tenants.forEach((t) => {
    const node = map.get(t.tenant_id)!;
    if (t.parent_tenant_id && map.has(t.parent_tenant_id)) {
      map.get(t.parent_tenant_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/** 更新租戶資訊 */
export async function updateTenant(
  tenantId: string,
  payload: Partial<Pick<Tenant, "tenant_name" | "short_name" | "address" | "phone" | "tax_id">>
): Promise<Tenant> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .update(payload)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
