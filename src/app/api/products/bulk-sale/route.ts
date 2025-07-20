import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ────────── POST /api/products/bulk-sale ────────── */
export async function POST(req: Request) {
    const { barcodes, saleType, salePrice, percentage, removeSale } = await req.json() as {
        barcodes: string[];
        saleType?: "fixed" | "percentage";
        salePrice?: number;
        percentage?: number;
        removeSale?: boolean;
    };

    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        return NextResponse.json({ error: "Barcodes array is required" }, { status: 400 });
    }

    try {
        if (removeSale) {
            // Remove sale prices
            await prisma.product.updateMany({
                where: {
                    barcode: {
                        in: barcodes.map(b => BigInt(b))
                    }
                },
                data: {
                    salePrice: null
                }
            });
        } else if (saleType === "percentage") {
            // Apply percentage-based sale
            if (!percentage || percentage <= 0 || percentage >= 100) {
                return NextResponse.json({ error: "Valid percentage between 1 and 99 is required" }, { status: 400 });
            }

            // Get all products to calculate their new sale prices
            const products = await prisma.product.findMany({
                where: {
                    barcode: {
                        in: barcodes.map(b => BigInt(b))
                    }
                },
                select: {
                    barcode: true,
                    price: true
                }
            });

            // Calculate new sale prices and update each product individually
            const multiplier = (100 - percentage) / 100;
            const updatePromises = products.map(product => {
                const originalPrice = Number(product.price);
                const newSalePrice = Math.round(originalPrice * multiplier * 100) / 100; // Round to 2 decimal places
                
                return prisma.product.update({
                    where: { barcode: product.barcode },
                    data: { salePrice: newSalePrice }
                });
            });

            await Promise.all(updatePromises);
        } else {
            // Apply fixed sale prices
            if (!salePrice || salePrice <= 0) {
                return NextResponse.json({ error: "Valid sale price is required" }, { status: 400 });
            }

            await prisma.product.updateMany({
                where: {
                    barcode: {
                        in: barcodes.map(b => BigInt(b))
                    }
                },
                data: {
                    salePrice: salePrice
                }
            });
        }

        const action = removeSale 
            ? `Removed sale from` 
            : saleType === "percentage" 
                ? `Applied ${percentage}% discount to`
                : `Applied sale to`;

        return NextResponse.json({
            success: true,
            message: `${action} ${barcodes.length} products`
        });
    } catch (error) {
        console.error("Bulk sale operation failed:", error);
        return NextResponse.json({ error: "Failed to update products" }, { status: 500 });
    }
}
