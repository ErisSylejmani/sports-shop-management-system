using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class KatalogModuli : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Kategorite",
                columns: table => new
                {
                    KategoriId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Emri = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Pershkrimi = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    KategoriaPrindId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kategorite", x => x.KategoriId);
                    table.ForeignKey(
                        name: "FK_Kategorite_Kategorite_KategoriaPrindId",
                        column: x => x.KategoriaPrindId,
                        principalTable: "Kategorite",
                        principalColumn: "KategoriId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Produktet",
                columns: table => new
                {
                    ProduktId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Emri = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Pershkrimi = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    KategoriId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Marka = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    CmimiBlerjes = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CmimiShitjes = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    SasiaStok = table.Column<int>(type: "int", nullable: false),
                    Madhesia = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Ngjyra = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Produktet", x => x.ProduktId);
                    table.ForeignKey(
                        name: "FK_Produktet_Kategorite_KategoriId",
                        column: x => x.KategoriId,
                        principalTable: "Kategorite",
                        principalColumn: "KategoriId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Kategorite_Emri",
                table: "Kategorite",
                column: "Emri");

            migrationBuilder.CreateIndex(
                name: "IX_Kategorite_KategoriaPrindId",
                table: "Kategorite",
                column: "KategoriaPrindId");

            migrationBuilder.CreateIndex(
                name: "IX_Produktet_Emri",
                table: "Produktet",
                column: "Emri");

            migrationBuilder.CreateIndex(
                name: "IX_Produktet_KategoriId",
                table: "Produktet",
                column: "KategoriId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Produktet");

            migrationBuilder.DropTable(
                name: "Kategorite");
        }
    }
}
