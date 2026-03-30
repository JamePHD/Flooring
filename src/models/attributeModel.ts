import { createAdminClient } from "../lib/supabase/admin";
import { createServerClient } from "../lib/supabase/server";

export interface AttributeGroup {
    id: string; 
    name: string; 
    slug: string; 
    sort_order: number; 
    created_at: string; 
}

export interface Attribute {
    id: string; 
    group_id: string; 
    name: string; 
    slug: string; 
    unit: string | null; 
    data_type: "text" | "number" | "boolean"; 
    sort_order: number; 
    created_at: string; 
}

export interface AttributeGroupWithAttributes extends AttributeGroup {
    attributes: Attribute[]; 
}

export interface ProductAttributeValue {
    id: string; 
    product_id: string; 
    attribute_id: string; 
    value: string; 
}

export interface CreateGroupInput {
    name: string; 
    slug: string; 
    sort_order?: number; 
}

export interface CreateAttributeInput {
    group_id: string; 
    name: string; 
    slug: string; 
    unit?: string; 
      data_type: "text" | "number" | "boolean";
  sort_order?: number;
}

export interface SetProductAttributeInput {
  product_id: string;
  attribute_id: string;
  value: string;
}


// ─── Public Queries ──────────────────────────────────────────

// Returns all groups with their nested attributes (tiered structure)
export async function getGroupsWithAttributes(): Promise<AttributeGroupWithAttributes[]> {
  const supabase = createServerClient();

  const { data: groups, error: groupError } = await supabase
    .from("attribute_groups")
    .select("*")
    .order("sort_order", { ascending: true });

  if (groupError) throw { message: "Failed to fetch attribute groups", status: 500 };

  const { data: attributes, error: attrError } = await supabase
    .from("attributes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (attrError) throw { message: "Failed to fetch attributes", status: 500 };

  return (groups as AttributeGroup[]).map((group) => ({
    ...group,
    attributes: (attributes as Attribute[]).filter((a) => a.group_id === group.id),
  }));
}

// Get all attribute values for a specific product
export async function getProductAttributes(productId: string): Promise<ProductAttributeValue[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("product_attributes")
    .select("*")
    .eq("product_id", productId);

  if (error) throw { message: "Failed to fetch product attributes", status: 500 };
  return data as ProductAttributeValue[];
}

// ─── Admin Queries ───────────────────────────────────────────

export async function createGroup(input: CreateGroupInput): Promise<AttributeGroup> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attribute_groups")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create group", status: 400 };
  return data as AttributeGroup;
}

export async function updateGroup(id: string, input: Partial<CreateGroupInput>): Promise<AttributeGroup> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attribute_groups")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update group", status: 400 };
  return data as AttributeGroup;
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("attribute_groups")
    .delete()
    .eq("id", id);

  if (error) throw { message: error.message || "Failed to delete group", status: 400 };
}

export async function createAttribute(input: CreateAttributeInput): Promise<Attribute> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attributes")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create attribute", status: 400 };
  return data as Attribute;
}

export async function updateAttribute(id: string, input: Partial<CreateAttributeInput>): Promise<Attribute> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attributes")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update attribute", status: 400 };
  return data as Attribute;
}

export async function deleteAttribute(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("attributes")
    .delete()
    .eq("id", id);

  if (error) throw { message: error.message || "Failed to delete attribute", status: 400 };
}

// Set or update a product's attribute value (upsert)
export async function setProductAttribute(input: SetProductAttributeInput): Promise<ProductAttributeValue> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_attributes")
    .upsert(input, { onConflict: "product_id,attribute_id" })
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to set product attribute", status: 400 };
  return data as ProductAttributeValue;
}