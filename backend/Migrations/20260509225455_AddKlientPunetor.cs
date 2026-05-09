using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddKlientPunetor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Klientet",
                columns: table => new
                {
                    KlientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Emri = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Mbiemri = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Telefoni = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Adresa = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataRegjistrimit = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PiketBesnikerise = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Klientet", x => x.KlientId);
                });

            migrationBuilder.CreateTable(
                name: "Punetoret",
                columns: table => new
                {
                    PunetorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Emri = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Mbiemri = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Pozita = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Telefoni = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    DataPunesimit = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Paga = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Punetoret", x => x.PunetorId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Klientet_DataRegjistrimit",
                table: "Klientet",
                column: "DataRegjistrimit");

            migrationBuilder.CreateIndex(
                name: "IX_Klientet_Email",
                table: "Klientet",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Punetoret_DataPunesimit",
                table: "Punetoret",
                column: "DataPunesimit");

            migrationBuilder.CreateIndex(
                name: "IX_Punetoret_Email",
                table: "Punetoret",
                column: "Email");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Klientet");

            migrationBuilder.DropTable(
                name: "Punetoret");
        }
    }
}
