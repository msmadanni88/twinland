# داده مکان‌ها

- فایل `TwinLand_Cafes_OSM_2026-10-06.xlsx` سه برگه دارد: اضافه‌شده، ردشده و خلاصه.
- فایل `twinland_cafes_osm_2026-10-06.csv` همان داده در یک جدول ساده است.
- منبع داده OpenStreetMap است و از راه `Overpass API` گرفته شده، با مجوز `ODbL`. ذکر «© OpenStreetMap contributors» روی نقشه لازم است.
- دستورهای ورود به دیتابیس در `Claude_WorkLog/sql/2026-10-07_osm_cafes_import.sql` ثبت شده است.
- مکان‌های واردشده در جدول `cafes` با `source = 'osm'` و ستون `osm_id` مشخص هستند.
