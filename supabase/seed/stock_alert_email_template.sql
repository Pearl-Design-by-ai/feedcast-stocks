-- Seed the `stock_alert` transactional template into FeedCast's shared
-- `email_templates` table so the Feedcast email sender can render the
-- "your price target was hit" email by template_key.
--
-- Idempotent: only inserts when the key is absent. Re-run to (re)create it
-- after deleting the row; edit the row directly in Feedcast to tweak copy.
--
-- Variables (Handlebars `{{ }}`, matching the existing welcome/digest rows):
--   symbol, alertName, conditionText, targetPrice, currentPrice, watchlistUrl

insert into public.email_templates (template_key, label, subject, html_body, variables)
select
  'stock_alert',
  'Stock Price Alert',
  '{{symbol}} hit your price alert',
  $html$<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{symbol}} price alert</title>
</head>
<body style="margin:0;padding:0;background:#f5f1eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f1eb">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e0d5">
          <tr>
            <td style="padding:28px 32px 8px 32px">
              <span style="display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0d9488">FeedCast Stocks</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0 32px">
              <h1 style="margin:0;font-size:24px;line-height:1.3;color:#1c1917">{{symbol}} hit your price alert</h1>
              <p style="margin:12px 0 0 0;font-size:16px;line-height:1.6;color:#57534e">
                Your alert <strong>{{alertName}}</strong> just triggered — {{symbol}} {{conditionText}}
                your target of <strong>{{targetPrice}}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f1eb;border-radius:12px">
                <tr>
                  <td style="padding:18px 20px">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size:13px;color:#78716c">Target price</td>
                        <td align="right" style="font-size:15px;font-weight:700;color:#1c1917">{{targetPrice}}</td>
                      </tr>
                      <tr><td colspan="2" style="height:8px;line-height:8px">&nbsp;</td></tr>
                      <tr>
                        <td style="font-size:13px;color:#78716c">Current price</td>
                        <td align="right" style="font-size:15px;font-weight:700;color:#0d9488">{{currentPrice}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px">
              <a href="{{watchlistUrl}}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px">
                View your watchlist
              </a>
              <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#a8a29e">
                You receive this because you set a price alert on FeedCast Stocks.
                Alerts pause automatically once triggered — re-arm them from your watchlist.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$html$,
  array['symbol','alertName','conditionText','targetPrice','currentPrice','watchlistUrl']
where not exists (
  select 1 from public.email_templates where template_key = 'stock_alert'
);
