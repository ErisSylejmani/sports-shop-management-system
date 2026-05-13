using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ModuliKthime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Kthimet",
                columns: table => new
                {
                    KthimId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShitjeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProduktId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sasia = table.Column<int>(type: "int", nullable: false),
                    Arsyeja = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DataKthimit = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Statusi = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kthimet", x => x.KthimId);
                    table.ForeignKey(
                        name: "FK_Kthimet_Produktet_ProduktId",
                        column: x => x.ProduktId,
                        principalTable: "Produktet",
                        principalColumn: "ProduktId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Kthimet_Shitjet_ShitjeId",
                        column: x => x.ShitjeId,
                        principalTable: "Shitjet",
                        principalColumn: "ShitjeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Kthimet_DataKthimit",
                table: "Kthimet",
                column: "DataKthimit");

            migrationBuilder.CreateIndex(
                name: "IX_Kthimet_ProduktId",
                table: "Kthimet",
                column: "ProduktId");

            migrationBuilder.CreateIndex(
                name: "IX_Kthimet_ShitjeId",
                table: "Kthimet",
                column: "ShitjeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Kthimet");
        }
    }
}
