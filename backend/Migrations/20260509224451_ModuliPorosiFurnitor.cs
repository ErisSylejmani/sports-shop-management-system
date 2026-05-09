using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ModuliPorosiFurnitor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PorositFurnitoreve",
                columns: table => new
                {
                    PorosiId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FurnitorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DataPorosise = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataPritshme = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ShumaTotale = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Statusi = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PorositFurnitoreve", x => x.PorosiId);
                    table.ForeignKey(
                        name: "FK_PorositFurnitoreve_Furnitoret_FurnitorId",
                        column: x => x.FurnitorId,
                        principalTable: "Furnitoret",
                        principalColumn: "FurnitorId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DetajetPorosiseFurnitorit",
                columns: table => new
                {
                    DetajPorosiId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PorosiId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProduktId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sasia = table.Column<int>(type: "int", nullable: false),
                    CmimiNjesi = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CmimiTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetajetPorosiseFurnitorit", x => x.DetajPorosiId);
                    table.ForeignKey(
                        name: "FK_DetajetPorosiseFurnitorit_PorositFurnitoreve_PorosiId",
                        column: x => x.PorosiId,
                        principalTable: "PorositFurnitoreve",
                        principalColumn: "PorosiId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetajetPorosiseFurnitorit_Produktet_ProduktId",
                        column: x => x.ProduktId,
                        principalTable: "Produktet",
                        principalColumn: "ProduktId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DetajetPorosiseFurnitorit_PorosiId",
                table: "DetajetPorosiseFurnitorit",
                column: "PorosiId");

            migrationBuilder.CreateIndex(
                name: "IX_DetajetPorosiseFurnitorit_ProduktId",
                table: "DetajetPorosiseFurnitorit",
                column: "ProduktId");

            migrationBuilder.CreateIndex(
                name: "IX_PorositFurnitoreve_DataPorosise",
                table: "PorositFurnitoreve",
                column: "DataPorosise");

            migrationBuilder.CreateIndex(
                name: "IX_PorositFurnitoreve_FurnitorId",
                table: "PorositFurnitoreve",
                column: "FurnitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetajetPorosiseFurnitorit");

            migrationBuilder.DropTable(
                name: "PorositFurnitoreve");
        }
    }
}
