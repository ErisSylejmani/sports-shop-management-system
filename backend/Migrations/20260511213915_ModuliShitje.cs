using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ModuliShitje : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Shitjet",
                columns: table => new
                {
                    ShitjeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KlientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PunetorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DataShitjes = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ShumaTotale = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Zbritja = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MetodaPageses = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shitjet", x => x.ShitjeId);
                    table.ForeignKey(
                        name: "FK_Shitjet_Klientet_KlientId",
                        column: x => x.KlientId,
                        principalTable: "Klientet",
                        principalColumn: "KlientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shitjet_Punetoret_PunetorId",
                        column: x => x.PunetorId,
                        principalTable: "Punetoret",
                        principalColumn: "PunetorId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DetajetShitjes",
                columns: table => new
                {
                    DetajShitjeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShitjeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProduktId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sasia = table.Column<int>(type: "int", nullable: false),
                    CmimiNjesi = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CmimiTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetajetShitjes", x => x.DetajShitjeId);
                    table.ForeignKey(
                        name: "FK_DetajetShitjes_Produktet_ProduktId",
                        column: x => x.ProduktId,
                        principalTable: "Produktet",
                        principalColumn: "ProduktId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DetajetShitjes_Shitjet_ShitjeId",
                        column: x => x.ShitjeId,
                        principalTable: "Shitjet",
                        principalColumn: "ShitjeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DetajetShitjes_ProduktId",
                table: "DetajetShitjes",
                column: "ProduktId");

            migrationBuilder.CreateIndex(
                name: "IX_DetajetShitjes_ShitjeId",
                table: "DetajetShitjes",
                column: "ShitjeId");

            migrationBuilder.CreateIndex(
                name: "IX_Shitjet_DataShitjes",
                table: "Shitjet",
                column: "DataShitjes");

            migrationBuilder.CreateIndex(
                name: "IX_Shitjet_KlientId",
                table: "Shitjet",
                column: "KlientId");

            migrationBuilder.CreateIndex(
                name: "IX_Shitjet_PunetorId",
                table: "Shitjet",
                column: "PunetorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetajetShitjes");

            migrationBuilder.DropTable(
                name: "Shitjet");
        }
    }
}
