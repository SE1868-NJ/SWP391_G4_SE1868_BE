const db = require('../config/DBConnect');

const calculateRankings = async (req, res) => {
    try {
        const { month } = req.query;
        const [year, monthNum] = month.split('-');

        // Query để lấy thông tin đơn hàng và đánh giá của shipper trong tháng
        const query = `
            SELECT 
                s.ShipperID,
                s.FullName,
                COUNT(DISTINCT o.OrderID) as SuccessfulOrders,
                SUM(
                    CASE 
                        WHEN r.Rating = 5 THEN 3
                        WHEN r.Rating = 4 THEN 2
                        ELSE 0
                    END
                ) as RatingPoints,
                (COUNT(DISTINCT o.OrderID) * 10 + 
                COALESCE(SUM(
                    CASE 
                        WHEN r.Rating = 5 THEN 3
                        WHEN r.Rating = 4 THEN 2
                        ELSE 0
                    END
                ), 0)) as TotalPoints
            FROM Shippers s
            LEFT JOIN Orders o ON s.ShipperID = o.ShipperID 
                AND o.OrderStatus = 'Delivered'
                AND YEAR(o.ActualDeliveryTime) = ?
                AND MONTH(o.ActualDeliveryTime) = ?
            LEFT JOIN Ratings r ON o.OrderID = r.OrderID
            GROUP BY s.ShipperID, s.FullName
            HAVING SuccessfulOrders > 0
            ORDER BY TotalPoints DESC
        `;

        db.query(query, [year, monthNum], (err, results) => {
            if (err) {
                console.error('Error calculating rankings:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Lỗi khi tính toán xếp hạng' 
                });
            }

            // Thêm thông tin xếp hạng
            const rankings = results.map((shipper, index) => ({
                ...shipper,
                Rank: index + 1
            }));

            res.json(rankings);
        });
    } catch (error) {
        console.error('Error in calculateRankings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi tính toán xếp hạng' 
        });
    }
};

module.exports = {
    calculateRankings
}; 