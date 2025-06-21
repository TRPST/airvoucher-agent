create or replace function get_agent_commission_statement(p_agent_id uuid, p_start_date date, p_end_date date)
returns jsonb as $$
declare
  v_summary record;
  v_sales jsonb;
  v_payouts jsonb;
begin
  -- Get all-time summary from get_agent_summary function
  select total_commission, paid_commission into v_summary from get_agent_summary(p_agent_id);

  -- Get sales in date range
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'date', s.created_at,
      'retailer_name', r.name,
      'type', vt.name,
      'value', s.sale_amount,
      'commission', s.agent_commission,
      'status', 'Pending'
    )), '[]'::jsonb)
  into v_sales
  from sales s
  join terminals t on s.terminal_id = t.id
  join retailers r on t.retailer_id = r.id
  join voucher_inventory vi on s.voucher_inventory_id = vi.id
  join voucher_types vt on vi.voucher_type_id = vt.id
  where r.agent_profile_id = p_agent_id
  and s.created_at >= p_start_date and s.created_at < (p_end_date + interval '1 day');

  -- Get payouts in date range
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'date', t.created_at,
      'retailer_name', t.notes, -- or null
      'type', 'Commission Payout',
      'value', 0,
      'commission', t.amount,
      'status', 'Paid'
    )), '[]'::jsonb)
  into v_payouts
  from transactions t
  where t.agent_profile_id = p_agent_id
  and t.type = 'commission_payout'
  and t.created_at >= p_start_date and t.created_at < (p_end_date + interval '1 day');

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'total_commission', v_summary.total_commission,
      'paid_commission', v_summary.paid_commission,
      'pending_commission', (v_summary.total_commission - v_summary.paid_commission),
      'transaction_count', (select jsonb_array_length(v_sales))
    ),
    'pending_transactions', v_sales,
    'paid_transactions', v_payouts
  );

end;
$$ language plpgsql; 