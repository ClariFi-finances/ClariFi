using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CPF",
                table: "Users",
                newName: "Cpf");

            migrationBuilder.RenameIndex(
                name: "IX_Users_CPF",
                table: "Users",
                newName: "IX_Users_Cpf");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_PaymentMethodId",
                table: "Transactions",
                column: "PaymentMethodId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_PaymentMethods_PaymentMethodId",
                table: "Transactions",
                column: "PaymentMethodId",
                principalTable: "PaymentMethods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_PaymentMethods_PaymentMethodId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_PaymentMethodId",
                table: "Transactions");

            migrationBuilder.RenameColumn(
                name: "Cpf",
                table: "Users",
                newName: "CPF");

            migrationBuilder.RenameIndex(
                name: "IX_Users_Cpf",
                table: "Users",
                newName: "IX_Users_CPF");
        }
    }
}
