import mysql from 'mysql2/promise';

const c = await mysql.createConnection({
    host: 'localhost',
    user: 'habbo',
    password: 'habbo',
    database: 'next'
});

const [[{ pages }]] = await c.query('SELECT COUNT(*) AS pages FROM catalog_pages');
const [[{ items }]] = await c.query('SELECT COUNT(*) AS items FROM catalog_items');
const [[{ visible }]] = await c.query("SELECT COUNT(*) AS visible FROM catalog_pages WHERE visible = '1'");
const [topPages] = await c.query(
    'SELECT page_id, COUNT(*) AS offers FROM catalog_items GROUP BY page_id ORDER BY offers DESC LIMIT 10'
);
const [topParents] = await c.query(
    'SELECT parent_id, COUNT(*) AS children FROM catalog_pages GROUP BY parent_id ORDER BY children DESC LIMIT 5'
);

// Estimate index packet: each node ~ (visible, icon, id, parent, name, caption, offerCount + offerIds + childCount)
let offerIdTotal = 0;
const [offerCounts] = await c.query(`
    SELECT cp.id, COUNT(ci.id) AS offer_count
    FROM catalog_pages cp
    LEFT JOIN catalog_items ci ON ci.page_id = cp.id
    WHERE cp.visible = '1'
    GROUP BY cp.id
`);
for (const row of offerCounts) offerIdTotal += Number(row.offer_count);

const [layouts] = await c.query(
    "SELECT page_layout, COUNT(*) AS cnt FROM catalog_pages WHERE visible = '1' GROUP BY page_layout ORDER BY cnt DESC LIMIT 12"
);
const [[avgRow]] = await c.query(
    'SELECT AVG(oc) AS avg_offers, MAX(oc) AS max_offers FROM (SELECT COUNT(*) AS oc FROM catalog_items GROUP BY page_id) t'
);
const [[over100]] = await c.query(
    'SELECT COUNT(*) AS c FROM (SELECT page_id FROM catalog_items GROUP BY page_id HAVING COUNT(*) > 100) x'
);
const [[over500]] = await c.query(
    'SELECT COUNT(*) AS c FROM (SELECT page_id FROM catalog_items GROUP BY page_id HAVING COUNT(*) > 500) x'
);
const estIndexKB = Math.round((Number(pages) * 80 + offerIdTotal * 4) / 1024);

console.log(
    JSON.stringify(
        { pages, items, visible, offerIdTotal, estIndexKB, topPages, topParents, layouts, avgRow, over100, over500 },
        null,
        2
    )
);
await c.end();
