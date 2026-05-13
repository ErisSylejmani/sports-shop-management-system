using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ModuliOferta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Ofertat",
                columns: table => new
                {
                    OfertaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Emri = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Pershkrimi = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    PerqindjaZbritjes = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    DataFillimit = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataPerfundimit = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Statusi = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ofertat", x => x.OfertaId);
                });

            migrationBuilder.CreateTable(
                name: "Oferte_Produkt",
                columns: table => new
                {
                    OferteProduktId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfertaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProduktId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oferte_Produkt", x => x.OferteProduktId);
                    table.ForeignKey(
                        name: "FK_Oferte_Produkt_Ofertat_OfertaId",
                        column: x => x.OfertaId,
                        principalTable: "Ofertat",
                        principalColumn: "OfertaId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Oferte_Produkt_Produktet_ProduktId",
                        column: x => x.ProduktId,
                        principalTable: "Produktet",
                        principalColumn: "ProduktId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ofertat_DataFillimit",
                table: "Ofertat",
                column: "DataFillimit");

            migrationBuilder.CreateIndex(
                name: "IX_Ofertat_DataPerfundimit",
                table: "Ofertat",
                column: "DataPerfundimit");

            migrationBuilder.CreateIndex(
                name: "IX_Oferte_Produkt_OfertaId",
                table: "Oferte_Produkt",
                column: "OfertaId");

            migrationBuilder.CreateIndex(
                name: "IX_Oferte_Produkt_OfertaId_ProduktId",
                table: "Oferte_Produkt",
                columns: new[] { "OfertaId", "ProduktId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Oferte_Produkt_ProduktId",
                table: "Oferte_Produkt",
                column: "ProduktId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Oferte_Produkt");

            migrationBuilder.DropTable(
                name: "Ofertat");
        }
    }
}
