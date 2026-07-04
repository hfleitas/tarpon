"""
Synthetic source-file generator for Fabric ingestion pipelines.

Run in a Fabric PySpark notebook cell:
    %run ./generate_ingestion_files.py
or paste this script into a notebook and execute.
"""

from pyspark.sql import functions as F

# -----------------------------------------------------------------------------
# 1) Generate synthetic retail transaction source files (CSV)
# -----------------------------------------------------------------------------
n_transactions = 100000
n_accounts = 25000

tx_source = (
    spark.range(1, n_transactions + 1)
    .withColumn("TxID", F.format_string("TX%09d", F.col("id")))
    .withColumn(
        "AccountID",
        F.format_string("A%08d", (F.floor(F.rand(11) * n_accounts) + 1).cast("int")),
    )
    .withColumn("Amount", F.round(F.rand(12) * 4500 - 200, 2))
    .withColumn(
        "Channel",
        F.element_at(
            F.array(
                F.lit("Mobile"),
                F.lit("Online"),
                F.lit("Branch"),
                F.lit("ATM"),
                F.lit("TreasuryPortal"),
            ),
            F.pmod(F.col("id"), F.lit(5)) + 1,
        ),
    )
    .withColumn(
        "Timestamp",
        F.from_unixtime(
            F.unix_timestamp(F.current_timestamp()) - (F.rand(13) * 14 * 24 * 3600).cast("int")
        ).cast("timestamp"),
    )
    .withColumn(
        "MerchantCategory",
        F.element_at(
            F.array(
                F.lit("Grocery"),
                F.lit("Fuel"),
                F.lit("Healthcare"),
                F.lit("Travel"),
                F.lit("Utilities"),
                F.lit("ECommerce"),
                F.lit("Payroll"),
            ),
            F.pmod(F.col("id"), F.lit(7)) + 1,
        ),
    )
    .drop("id")
)

(
    tx_source.coalesce(8)
    .write.mode("overwrite")
    .option("header", True)
    .csv("Files/Ingestion/retail_transactions/dt=current")
)

# -----------------------------------------------------------------------------
# 2) Generate treasury positions source files (CSV)
# -----------------------------------------------------------------------------
n_positions = 15000
n_clients = 2500

treasury_source = (
    spark.range(1, n_positions + 1)
    .withColumn("PositionID", F.format_string("P%08d", F.col("id")))
    .withColumn(
        "ClientID",
        F.format_string("CL%06d", (F.floor(F.rand(21) * n_clients) + 1).cast("int")),
    )
    .withColumn(
        "Currency",
        F.element_at(
            F.array(F.lit("USD"), F.lit("EUR"), F.lit("GBP"), F.lit("CAD"), F.lit("JPY")),
            F.pmod(F.col("id"), F.lit(5)) + 1,
        ),
    )
    .withColumn("Amount", F.round(F.rand(22) * 15000000 + 50000, 2))
    .withColumn(
        "LiquidityBucket",
        F.element_at(
            F.array(F.lit("0-7D"), F.lit("8-30D"), F.lit("31-90D"), F.lit("90D+")),
            F.pmod(F.col("id"), F.lit(4)) + 1,
        ),
    )
    .drop("id")
)

(
    treasury_source.coalesce(4)
    .write.mode("overwrite")
    .option("header", True)
    .csv("Files/Ingestion/treasury_positions/dt=current")
)

# -----------------------------------------------------------------------------
# 3) Generate AML alerts source files (JSON)
# -----------------------------------------------------------------------------
n_alerts = 5000
n_customers = 10000

aml_source = (
    spark.range(1, n_alerts + 1)
    .withColumn("AlertID", F.format_string("AL%08d", F.col("id")))
    .withColumn(
        "CustomerID",
        F.format_string("C%06d", (F.floor(F.rand(31) * n_customers) + 1).cast("int")),
    )
    .withColumn(
        "TxID",
        F.format_string("TX%09d", (F.floor(F.rand(32) * n_transactions) + 1).cast("int")),
    )
    .withColumn("RiskScore", F.round(F.rand(33) * 100, 2))
    .withColumn(
        "Reason",
        F.element_at(
            F.array(
                F.lit("Structuring pattern"),
                F.lit("High-risk geography"),
                F.lit("Rapid movement across channels"),
                F.lit("Counterparty risk indicator"),
                F.lit("Unusual transaction velocity"),
            ),
            F.pmod(F.col("id"), F.lit(5)) + 1,
        ),
    )
    .withColumn(
        "CreatedAt",
        F.from_unixtime(
            F.unix_timestamp(F.current_timestamp()) - (F.rand(34) * 7 * 24 * 3600).cast("int")
        ).cast("timestamp"),
    )
    .drop("id")
)

aml_source.coalesce(4).write.mode("overwrite").json("Files/Ingestion/aml_alerts/dt=current")

# -----------------------------------------------------------------------------
# 4) Generate digital engagement logs (JSON lines style directory)
# -----------------------------------------------------------------------------
n_events = 300000

digital_source = (
    spark.range(1, n_events + 1)
    .withColumn(
        "CustomerID",
        F.format_string("C%06d", (F.floor(F.rand(41) * n_customers) + 1).cast("int")),
    )
    .withColumn(
        "EventType",
        F.element_at(
            F.array(
                F.lit("Login"),
                F.lit("BillPay"),
                F.lit("Transfer"),
                F.lit("CardControls"),
                F.lit("TreasuryApproval"),
                F.lit("ProfileUpdate"),
            ),
            F.pmod(F.col("id"), F.lit(6)) + 1,
        ),
    )
    .withColumn(
        "Device",
        F.when(F.rand(42) > 0.62, F.lit("Mobile"))
        .when(F.rand(43) > 0.5, F.lit("Web"))
        .otherwise(F.lit("Tablet")),
    )
    .withColumn(
        "Timestamp",
        F.from_unixtime(
            F.unix_timestamp(F.current_timestamp()) - (F.rand(44) * 30 * 24 * 3600).cast("int")
        ).cast("timestamp"),
    )
    .drop("id")
)

digital_source.coalesce(8).write.mode("overwrite").json("Files/Ingestion/digital_logs/dt=current")

print("Synthetic ingestion files generated under Files/Ingestion/")
